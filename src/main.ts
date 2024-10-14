import * as fs from 'fs';
import WebSocket from 'ws';


export function ReadData(path: string): string {
  const data = fs.readFileSync(path, 'utf-8');
  return data;
}


export function ConnectionToServer(port: number): WebSocket.Server {
  const wss = new WebSocket.Server({ port: 8888 });
  console.log("server start on 8888");
  return wss;
}

class DataBase {
  db: any;

  constructor() {
    const mysql = require("mysql");
    const db_option = {
      host: 'localhost',
      user: 'root',
      password: 'Jet..123@2024!',
      database: 'netai_data_scients',
    }

    this.db = mysql.createConnection(db_option)

  }

  public CheckConnection(): any {
    this.db.connect((err: Error) => {
      if (err) {
        throw err;
      }
      return "db connected";
    })
  }

  public async CheckUser(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        this.db.query(
            'SELECT * FROM User WHERE userName = ? AND password = ?',
            [username, password],
            (err: Error, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.length === 1);
                }
            }
        );
    });
}

  public InsertData(question: string, response: string, uuid: string): void {
    this.db.query(`INSERT INTO questiontable VALUES("${uuid}",${question},"${response}",CURRENT_TIMESTAMP)`, (err: Error, result: object) => {
      if (err) {
        throw err;
      }
    })
  }


}

async function WssListener(wss:WebSocket.Server,db:any)
{
  wss.on('connection', (ws: WebSocket,req:any) => {
    console.log('New client connected');
    ws.send(JSON.stringify("asd"));

    ws.on('message', (message: string) => {
      
    });

    ws.on('close', () => {
      ws.send(JSON.stringify("asd"))
    });
  });
}
async function main()
{
  let port=8888;
  const wss=ConnectionToServer(port)

  let db = new DataBase();
  
  WssListener(wss,db);
}

main();