"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadData = ReadData;
exports.ConnectionToServer = ConnectionToServer;
const fs = __importStar(require("fs"));
const ws_1 = __importDefault(require("ws"));
function ReadData(path) {
    const data = fs.readFileSync(path, 'utf-8');
    return data;
}
function ConnectionToServer(port) {
    const wss = new ws_1.default.Server({ port: 8888 });
    console.log("server start on 8888");
    return wss;
}
class DataBase {
    constructor() {
        const mysql = require("mysql");
        const db_option = {
            host: 'localhost',
            user: 'root',
            password: 'Jet..123@2024!',
            database: 'netai_data_scients',
        };
        this.db = mysql.createConnection(db_option);
    }
    CheckConnection() {
        this.db.connect((err) => {
            if (err) {
                throw err;
            }
            return "db connected";
        });
    }
    CheckUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.query('SELECT * FROM User WHERE userName = ? AND password = ?', [username, password], (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(result.length === 1);
                    }
                });
            });
        });
    }
    InsertData(question, response, uuid) {
        this.db.query(`INSERT INTO questiontable VALUES("${uuid}",${question},"${response}",CURRENT_TIMESTAMP)`, (err, result) => {
            if (err) {
                throw err;
            }
        });
    }
}
function WssListener(wss, db) {
    return __awaiter(this, void 0, void 0, function* () {
        wss.on('connection', (ws, req) => {
            console.log('New client connected');
            ws.send(JSON.stringify("asd"));
            ws.on('message', (message) => {
            });
            ws.on('close', () => {
                ws.send(JSON.stringify("asd"));
            });
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let port = 8888;
        const wss = ConnectionToServer(port);
        let db = new DataBase();
        WssListener(wss, db);
    });
}
main();
