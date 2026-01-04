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
// test-list-parser.ts（临时文件，可以放在项目根目录）
var listParser_1 = require("./src/parser/listParser");
var fs = require("fs");
var path = require("path");
function testListParser() {
    return __awaiter(this, void 0, void 0, function () {
        var htmlPath, html, books, nextUrl;
        return __generator(this, function (_a) {
            try {
                htmlPath = path.join(__dirname, 'test-data', 'list-page.html');
                if (fs.existsSync(htmlPath)) {
                    html = fs.readFileSync(htmlPath, 'utf-8');
                    books = listParser_1.listParser.parse(html);
                    console.log('解析结果:');
                    books.forEach(function (book, index) {
                        console.log("".concat(index + 1, ". ").concat(book.title));
                        console.log("   \u94FE\u63A5: ".concat(book.detailUrl));
                        console.log("   \u5C01\u9762: ".concat(book.coverUrl.substring(0, 50), "..."));
                        console.log("   \u8BC4\u5206: ".concat(book.rating || '无'));
                        console.log('---');
                    });
                    nextUrl = listParser_1.listParser.parseNextPageUrl(html);
                    console.log("\u4E0B\u4E00\u9875URL: ".concat(nextUrl || '无'));
                }
                else {
                    console.log('测试文件不存在，请先保存一个列表页HTML到 test-data/list-page.html');
                    console.log('你可以：');
                    console.log('1. 访问 https://book.douban.com/tag/编程?start=0&type=T');
                    console.log('2. 右键 -> 查看页面源代码');
                    console.log('3. 复制全部HTML，保存为 list-page.html');
                }
            }
            catch (error) {
                console.error('测试失败:', error);
            }
            return [2 /*return*/];
        });
    });
}
testListParser();
