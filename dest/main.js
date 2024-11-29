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
exports.DataBase = void 0;
const fs = __importStar(require("fs"));
const WebSocket = require("ws");
const mysql_1 = __importDefault(require("mysql"));
const path_1 = __importDefault(require("path"));
const Predict_1 = __importDefault(require("./Predict"));
function ConnectionToServer(port) {
    const wss = new WebSocket.Server({ port: 8888, host: "0.0.0.0" });
    console.log("server start on 8888");
    return wss;
}
class DataBase {
    constructor() {
        this.db_option = {
            host: 'localhost',
            user: 'root',
            password: 'Jet..123@2024!',
            database: 'netai_data_scients',
            connectionLimit: 10000000,
            queueLimit: 30000,
            waitForConnections: true,
            acquireTimeout: 100000000,
            idleTimeout: 2147483647
        };
        this.pool = mysql_1.default.createPool(this.db_option);
        setInterval(() => {
            this.pool.query('SELECT 1', (err) => {
                if (err) {
                    console.error('Keep-alive query failed:', err);
                }
                else {
                    console.log('Keep-alive query successful');
                }
            });
        }, 1073741823);
    }
    close() {
        this.pool.end((err) => {
            if (err) {
                console.error('Error closing the database connection pool:', err);
            }
            else {
                console.log('Database connection pool closed.');
            }
        });
    }
    CheckUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.pool.query('SELECT * FROM account WHERE account = ? AND password = ?', [username, password], (err, result) => {
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
    ModifyPassword(account, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const cmd = `UPDATE account set password = ? WHERE account = ?`;
                this.pool.query(cmd, [newPassword, account], (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    else {
                        return resolve(true);
                    }
                });
            });
        });
    }
    GetAllResult() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.pool.query('WITH RankedSubmissions AS (SELECT sr.*, ROW_NUMBER() OVER (PARTITION BY sr.groupName ORDER BY sr.publicAUC DESC, sr.time DESC) AS rn FROM submissionRecord sr ) SELECT * FROM RankedSubmissions WHERE rn = 1', (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        if (Object.keys(result).length > 0) {
                            return resolve(result);
                        }
                    }
                });
            });
        });
    }
    GetGroupResult(groupName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.pool.query('SELECT * FROM submissionRecord WHERE groupName = ?', [groupName], (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        if (Object.keys(result).length > 0) {
                            return resolve(result);
                        }
                    }
                });
            });
        });
    }
    GetGroupName(account) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.pool.query(`SELECT distinct name FROM groupName WHERE account = ?`, [account], (err, result) => {
                    if (err) {
                        console.log(err);
                        return reject(err);
                    }
                    else {
                        if (result.length > 0) {
                            let groupname = result.map((row) => row.name);
                            return resolve(groupname);
                        }
                        else {
                            return resolve(undefined);
                        }
                    }
                });
            });
        });
    }
    InsertScore(publicScore, privateScore, groupName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.pool.query('INSERT INTO submissionRecord (groupName, time, publicAUC, privateAUC) VALUES (?, NOW(), ?, ?)', [groupName, publicScore, privateScore], (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(result);
                    }
                });
            });
        });
    }
}
exports.DataBase = DataBase;
function WssListener(wss, db) {
    return __awaiter(this, void 0, void 0, function* () {
        wss.on('connection', (ws) => {
            console.log("connected");
            try {
                ws.on('message', (message) => {
                    let msg = JSON.parse(message);
                    try {
                        if (msg['flag'] === 'Login') {
                            db.CheckUser(msg['username'], msg['password']).then((e) => {
                                console.log(e);
                                if (e) {
                                    db.GetGroupName(msg['username']).then((groupname) => {
                                        ws.send(JSON.stringify({ messageField: "True", detail: "login Successful", groupName: groupname }));
                                    });
                                }
                                else
                                    ws.send(JSON.stringify({ messageField: "False", detail: "username or password error" }));
                            });
                        }
                        else if (msg['flag'] === 'ShowOverallBoard') {
                            db.GetAllResult().then((e) => {
                                ws.send(JSON.stringify({
                                    items: e
                                }));
                            });
                        }
                        else if (msg['flag'] === 'Register') {
                            if (msg['password'] === msg['secondpassword']) {
                                db.InsertData(msg['username'], msg['password']).then((e) => {
                                    if (e == false)
                                        ws.send(JSON.stringify({ messageField: "True", detail: "register Successful" }));
                                    else
                                        ws.send(JSON.stringify({ messageField: "False", detail: "username exist" }));
                                });
                            }
                            else {
                                ws.send(JSON.stringify({ messageField: "False", detail: "typo error" }));
                            }
                        }
                        else if (msg['flag'] === 'Modify') {
                            if (msg['password'] === msg['secondpassword']) {
                                db.ModifyPassword(msg['userName'], msg['password']).then((e) => {
                                    if (e == true)
                                        ws.send(JSON.stringify({ messageField: "True", detail: "修改成功" }));
                                    else
                                        ws.send(JSON.stringify({ messageField: "False", detail: "發生錯誤，稍後重試" }));
                                });
                            }
                            else {
                                ws.send(JSON.stringify({ messageField: "False", detail: "密碼不一致" }));
                            }
                        }
                        else if (msg['flag'] === 'Upload') {
                            let tmp = msg['filename'].split('.');
                            let typeOfFile = tmp.pop();
                            if (typeOfFile === 'rar' || typeOfFile === 'zip' || typeOfFile === '7z') {
                                const filename = `_${Date.now()}`;
                                const filePath = path_1.default.join(__dirname, '../studentItems', msg['username'] + `${filename}.${typeOfFile}`);
                                fs.writeFile(filePath, Buffer.from(msg['filebuffer'], 'base64'), (err) => {
                                    if (err) {
                                        console.error('文件保存失敗', err);
                                        ws.send(JSON.stringify({ messageField: "False", detail: "資料上傳失敗" }));
                                    }
                                    else {
                                        ws.send(JSON.stringify({ messageField: "True", detail: "資料上傳成功", filename: msg['filename'] }));
                                        (0, Predict_1.default)(msg['username'] + filename, typeOfFile, msg['groupName']);
                                    }
                                });
                            }
                            else {
                                console.error('文件保存失敗');
                                ws.send(JSON.stringify({ messageField: "False", detail: "檔案格式不正確，必須為下列各式：\nrar,zip,7z" }));
                            }
                        }
                        else if (msg['flag'] === 'ShowBoard') {
                            db.GetGroupResult(msg['groupName']).then((e) => {
                                ws.send(JSON.stringify({
                                    items: e
                                }));
                            });
                        }
                        else {
                        }
                    }
                    catch (error) {
                    }
                });
                ws.on('close', () => {
                });
                ws.on('error', (error) => {
                    console.error(`WebSocket error: ${error.message}`);
                });
            }
            catch (_a) {
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let port = 8888;
        const wss = ConnectionToServer(port);
        let dataBase = new DataBase();
        WssListener(wss, dataBase);
        process.on('SIGINT', () => {
            dataBase.close();
            process.exit();
        });
        process.on('SIGTERM', () => {
            dataBase.close();
            process.exit();
        });
    });
}
main();
