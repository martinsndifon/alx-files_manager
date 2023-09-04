/* eslint-disable no-param-reassign */
/* eslint-disable comma-dangle */
/* eslint-disable no-underscore-dangle */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { createFile } from '../utils/utils';

class FilesController {
  static async currentUser(req) {
    const token = req.headers['x-token'];
    if (!token) {
      return null;
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return null;
    }
    const user = await dbClient.getUserById(userId);
    if (!user) {
      return null;
    }
    return user;
  }

  static async postUpload(req, res) {
    const user = await FilesController.currentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' }).end();
    }
    const { name, type, data } = req.body;
    let { parentId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' }).end();
    }
    const types = ['folder', 'file', 'image'];
    if (!type || !types.includes(type)) {
      return res.status(400).json({ error: 'Missing type' }).end();
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' }).end();
    }
    if (parentId) {
      const file = await dbClient.getFileById(parentId);
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' }).end();
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' }).end();
      }
    } else {
      parentId = 0;
    }
    const isPublic = req.body.isPublic ? req.body.isPublic : false;
    if (type === 'folder') {
      const userId = user._id;
      const fileObj = await dbClient.uploadFile(
        userId,
        name,
        type,
        isPublic,
        parentId
      );
      const file = fileObj.ops[0];
      const obj = {
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      };
      return res.status(201).json(obj).end();
    }
    const localPath = createFile(data);
    const userId = user._id;
    const fileObj = await dbClient.uploadFile(
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath
    );
    const file = fileObj.ops[0];
    const obj = {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    };
    return res.status(201).json(obj).end();
  }

  static async getShow(req, res) {
    const user = await FilesController.currentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' }).end();
    }
    const userId = user._id;
    const { id } = req.params;
    const file = await dbClient.getFileById(id);
    if (!file || userId.toString() !== file.userId) {
      return res.status(404).json({ error: 'Not found' }).end();
    }
    const obj = {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    };
    return res.status(200).json(obj).end();
  }

  static async getIndex(req, res) {
    const user = await FilesController.currentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' }).end();
    }
    const ITEMS_PER_PAGE = 20;
    const { parentId } = req.query;
    let { page } = req.query;
    page = Number(page) || 0;
    const skip = page * ITEMS_PER_PAGE;
    const userId = user._id.toString();

    if (parentId) {
      const pipeline = [
        {
          $match: {
            parentId,
            userId,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: ITEMS_PER_PAGE,
        },
      ];
      const files = await dbClient.getFilesByParentId(pipeline);
      if (!files) {
        return res.json([]).end();
      }
      files.forEach((file) => {
        delete file.localPath;
      });
      return res.json(files).end();
    }
    const pipeline = [
      {
        $match: {
          userId,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: ITEMS_PER_PAGE,
      },
    ];
    const files = await dbClient.getAllFiles(pipeline);
    if (!files) {
      return res.json([]).end();
    }
    files.forEach((file) => {
      delete file.localPath;
    });
    return res.json(files).end();
  }
}

export default FilesController;
