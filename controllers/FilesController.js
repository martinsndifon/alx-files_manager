/* eslint-disable comma-dangle */
/* eslint-disable no-underscore-dangle */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { createFile } from '../utils/utils';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' }).end();
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' }).end();
    }
    const user = await dbClient.getUserById(userId);
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
}

export default FilesController;
