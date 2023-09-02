#!/usr/bin/node

import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1';
    const port = process.env.DB_PORT ? process.env.DB_PORT : 27017;
    this.database = process.env.DB_DATABASE
      ? process.env.DB_DATABASE
      : 'files_manager';
    const dbUrl = `mongodb://${host}:${port}`;
    this.connected = false;
    this.client = new MongoClient(dbUrl, { useUnifiedTopology: true });
    this.client
      .connect()
      .then(() => {
        this.connected = true;
      })
      .catch((err) => console.log(err.message));
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (!this.connected) {
      await this.client.connect(); // Reconnect if not already connected
    }
    const users = await this.client
      .db(this.database)
      .collection('users')
      .countDocuments();
    return users;
  }

  async nbFiles() {
    if (!this.connected) {
      await this.client.connect();
    }
    const files = await this.client
      .db(this.database)
      .collection('files')
      .countDocuments();
    return files;
  }
}

const dbClient = new DBClient();
export default dbClient;
