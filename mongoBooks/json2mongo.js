"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var fs = require("fs");
var path = require("path");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var BookSchema, BookModel, filePath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, mongoose.connect('mongodb://localhost:27017/books')
                    .then(function () { return console.log("✅ MongoDB 连接成功"); })
                    .catch(function (err) { return console.log("❌ 连接失败:", err); })
                // 创建"图书Book"文档结构 - 根据你的JSON字段名
            ];
            case 1:
                _a.sent();
                BookSchema = new mongoose.Schema({
                    title: String,
                    detailUrl: String,
                    imgUrl: String,
                    localImgPath: String,
                    author: String,
                    price: Number,
                    isbn: String,
                    publishDate: String,
                    intro: String
                });
                BookModel = mongoose.model('Book', BookSchema);
                filePath = path.resolve('./books.json');
                fs.readFile(filePath, 'utf8', function (err, data) { return __awaiter(void 0, void 0, void 0, function () {
                    var books, successCount, errorCount, duplicateCount, i, item, existingBook, error_1, parseError_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (err) {
                                    console.log("❌ 读取文件失败:", err);
                                    return [2 /*return*/];
                                }
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 11, 12, 14]);
                                books = JSON.parse(data);
                                console.log("\uD83D\uDCDA \u627E\u5230 ".concat(books.length, " \u672C\u4E66\uFF0C\u5F00\u59CB\u5BFC\u5165..."));
                                successCount = 0;
                                errorCount = 0;
                                duplicateCount = 0;
                                i = 0;
                                _a.label = 2;
                            case 2:
                                if (!(i < books.length)) return [3 /*break*/, 10];
                                item = books[i];
                                _a.label = 3;
                            case 3:
                                _a.trys.push([3, 6, , 7]);
                                return [4 /*yield*/, BookModel.findOne({ isbn: item.isbn })];
                            case 4:
                                existingBook = _a.sent();
                                if (existingBook) {
                                    console.log("\u23E9 [".concat(i + 1, "/").concat(books.length, "] \u8DF3\u8FC7\u91CD\u590D: ").concat(item.title));
                                    duplicateCount++;
                                    return [3 /*break*/, 9];
                                }
                                // 创建新文档
                                return [4 /*yield*/, BookModel.create({
                                        title: item.title,
                                        detailUrl: item.detailUrl,
                                        imgUrl: item.imgUrl,
                                        localImgPath: item.localImgPath,
                                        author: item.author,
                                        price: item.price,
                                        isbn: item.isbn,
                                        publishDate: item.publishDate,
                                        intro: item.intro
                                    })];
                            case 5:
                                // 创建新文档
                                _a.sent();
                                successCount++;
                                console.log("\u2705 [".concat(i + 1, "/").concat(books.length, "] \u5BFC\u5165\u6210\u529F: ").concat(item.title));
                                return [3 /*break*/, 7];
                            case 6:
                                error_1 = _a.sent();
                                errorCount++;
                                console.log("\u274C [".concat(i + 1, "/").concat(books.length, "] \u5BFC\u5165\u5931\u8D25: ").concat(item.title), error_1);
                                return [3 /*break*/, 7];
                            case 7:
                                if (!(i % 10 === 0)) return [3 /*break*/, 9];
                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                            case 8:
                                _a.sent();
                                _a.label = 9;
                            case 9:
                                i++;
                                return [3 /*break*/, 2];
                            case 10:
                                console.log("\n\uD83C\uDF89 \u5BFC\u5165\u5B8C\u6210!");
                                console.log("\uD83D\uDCCA \u7EDF\u8BA1\u7ED3\u679C:");
                                console.log("   - \u6210\u529F\u5BFC\u5165: ".concat(successCount, " \u672C"));
                                console.log("   - \u91CD\u590D\u8DF3\u8FC7: ".concat(duplicateCount, " \u672C"));
                                console.log("   - \u5BFC\u5165\u5931\u8D25: ".concat(errorCount, " \u672C"));
                                return [3 /*break*/, 14];
                            case 11:
                                parseError_1 = _a.sent();
                                console.log("❌ JSON解析失败:", parseError_1);
                                return [3 /*break*/, 14];
                            case 12: 
                            // 关闭数据库连接
                            return [4 /*yield*/, mongoose.disconnect()];
                            case 13:
                                // 关闭数据库连接
                                _a.sent();
                                console.log("🔌 数据库连接已关闭");
                                return [7 /*endfinally*/];
                            case 14: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); })();
