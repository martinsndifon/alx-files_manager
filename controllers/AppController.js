#!/usr/bin/node

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    res.statusCode = 200;
    let dbAlive = false;
    if (dbClient.isAlive()) {
      dbAlive = true;
    }
    let redisAlive = false;
    if (redisClient.isAlive()) {
      redisAlive = true;
    }
    res.end(JSON.stringify({ redis: redisAlive, db: dbAlive }));
  }

  static async getStats(req, res) {
    res.statusCode = 200;
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    res.end(JSON.stringify({ users: nbUsers, files: nbFiles }));
  }
}

export default AppController;
