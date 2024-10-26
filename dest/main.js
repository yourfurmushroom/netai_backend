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
function ReadData(path) {
    const data = fs.readFileSync(path, 'utf-8');
    return data;
}
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
        };
    }
    CheckConnection() {
        this.db.connect((err) => {
            if (err) {
                console.error('Database connection error:', err);
                return;
            }
            console.log("Database connected");
        });
    }
    CheckUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = mysql_1.default.createConnection(this.db_option);
            return new Promise((resolve, reject) => {
                this.db.query('SELECT * FROM account WHERE account = ? AND password = ?', [username, password], (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        this.db.end();
                        resolve(result.length === 1);
                    }
                });
            });
        });
    }
    VerifyInDatabase(username) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.query('SELECT * FROM account WHERE userName = ?', [username], (err, result) => {
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
    InsertData(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = mysql_1.default.createConnection(this.db_option);
            const veryfied = yield this.VerifyInDatabase(username);
            console.log(veryfied);
            try {
                if (!veryfied)
                    this.db.query(`INSERT INTO User VALUES("${username}","${password}")`, (err, result) => {
                        if (err) {
                            this.db.end();
                            throw err;
                        }
                        else {
                            this.db.end();
                        }
                    });
                return veryfied;
            }
            catch (_a) {
                this.db.end();
                return true;
            }
        });
    }
    ModifyPassword(account, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = mysql_1.default.createConnection(this.db_option);
            try {
                this.db.query(`UPDATE account set password = '${newPassword}' where account = '${account}'`, (err, result) => {
                    if (err) {
                        this.db.end();
                        throw err;
                    }
                    else {
                        this.db.end();
                        return true;
                    }
                });
                return true;
            }
            catch (_a) {
                this.db.end();
                return false;
            }
        });
    }
    GetAllResult() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db = mysql_1.default.createConnection(this.db_option);
                this.db.query(`select * from submissionRecord`, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        if (Object.keys(result).length > 0) {
                            return resolve(result);
                        }
                    }
                });
                this.db.end();
                this.db = null;
            });
        });
    }
    GetGroupResult(groupName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db = mysql_1.default.createConnection(this.db_option);
                this.db.query(`select * from submissionRecord where groupName = ?`, [groupName], (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log(`result is : ${Object.keys(result).length}`);
                        if (Object.keys(result).length > 0) {
                            return resolve(result);
                        }
                    }
                });
                this.db.end();
                this.db = null;
            });
        });
    }
    GetGroupName(account) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = mysql_1.default.createConnection(this.db_option);
            try {
                return new Promise((resolve, reject) => {
                    this.db.query(`SELECT name FROM groupName WHERE account='${account}'`, (err, result) => {
                        if (err) {
                            console.log(err);
                            this.db.end();
                            return reject(err);
                        }
                        else {
                            this.db.end();
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
            }
            catch (e) {
                this.db.end();
                console.log(e);
                return undefined;
            }
        });
    }
    InsertScore(publicScore, privateScore, groupName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db = mysql_1.default.createConnection(this.db_option);
                this.db.query('insert into submissionRecord (groupName, time, publicAUC, privateAUC) values (?,NOW(),?,?)', [groupName, publicScore, privateScore], (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                    }
                });
                this.db.end();
                this.db = null;
            });
        });
    }
}
exports.DataBase = DataBase;
function WssListener(wss, db) {
    return __awaiter(this, void 0, void 0, function* () {
        wss.on('connection', (ws) => {
            // ws.send(JSON.stringify({
            //   items:['aa','bb','cc','aa','bb','cc','aa','bb','cc']
            // }))
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
                                        // console.log(db.GetGroupName(msg['username']))
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
                                        console.log('文件已保存:', filePath);
                                        console.log(msg['filename']);
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
                        console.log(error);
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
    });
}
main();
