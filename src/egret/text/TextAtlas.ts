//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

namespace egret {

    export let __MAX_PAGE_SIZE__ = 1024;
    export let __TXT_BLOCK_OFFSET__ = 1;
    export let __book__: Book = null;
    export function configTextTextureAtlas(maxPageSize: number, offset: number): boolean {
        if (!__book__) {
            __book__ = new Book;
            __MAX_PAGE_SIZE__ = maxPageSize;
            __TXT_BLOCK_OFFSET__ = offset;
            return true;
        }
        console.warn('repeat config: maxPageSize = ' + maxPageSize + ', offset = ' + offset);
        return false;
    }

    let globalGUID = 0;

    export class TextBlock {

        public readonly _id = ++globalGUID;
        private _width: number = 0;
        private _height: number = 0;
        public line: Line = null;
        public x: number = 0;
        public y: number = 0;

        constructor(width: number, height: number) {
            this._width = width;
            this._height = height;
        }

        public get width(): number {
            return this._width + __TXT_BLOCK_OFFSET__ * 2;
        }

        public get height(): number {
            return this._height + __TXT_BLOCK_OFFSET__ * 2;
        }
    }

    export class Line {

        public readonly _id = ++globalGUID;
        public page: Page = null;
        public readonly textBlocks: TextBlock[] = [];
        public dynamicMaxHeight: number = 0;
        public readonly maxWidth: number = 0;
        public x: number = 0;
        public y: number = 0;

        constructor(maxWidth: number) {
            this.maxWidth = maxWidth;
        }

        public isCapacityOf(textBlock: TextBlock): boolean {
            if (!textBlock) {
                return false;
            }
            //
            let posx = 0;
            let posy = 0;
            const lastTxtBlock = this.lastTextBlock();
            if (lastTxtBlock) {
                posx = lastTxtBlock.x + lastTxtBlock.width;
                posy = lastTxtBlock.y;
            }
            //
            if (posx + textBlock.width > this.maxWidth) {
                return false;//宽度不够
            }
            //
            if (this.dynamicMaxHeight > 0 && posy + textBlock.height > this.dynamicMaxHeight) {
                return false;//如果有已经有动态高度，到这里，说明高度也不够
            }
            return true;
        }

        public lastTextBlock(): TextBlock {
            const textBlocks = this.textBlocks;
            if (textBlocks.length > 0) {
                return textBlocks[textBlocks.length - 1];
            }
            return null;
        }

        public addTextBlock(textBlock: TextBlock, needCheck: boolean): boolean {
            //
            if (!textBlock) {
                return false;
            }
            //
            if (needCheck) {
                if (!this.isCapacityOf(textBlock)) {
                    return false;
                }
            }
            //
            let posx = 0;
            let posy = 0;
            const lastTxtBlock = this.lastTextBlock();
            if (lastTxtBlock) {
                posx = lastTxtBlock.x + lastTxtBlock.width;
                posy = lastTxtBlock.y;
            }
            //
            textBlock.x = posx;
            textBlock.y = posy;
            textBlock.line = this;
            this.textBlocks.push(textBlock);
            this.dynamicMaxHeight = Math.max(this.dynamicMaxHeight, textBlock.height);
            return true;
        }
    }

    export class Page {

        public readonly _id = ++globalGUID;
        public readonly lines: Line[] = [];
        public readonly pageWidth: number = 0;
        public readonly pageHeight: number = 0;

        constructor(pageWidth: number, pageHeight: number) {
            this.pageWidth = pageWidth;
            this.pageHeight = pageHeight;
        }

        public addLine(line: Line): boolean {
            if (!line) {
                return false;
            }
            //
            let posx = 0;
            let posy = 0;
            //
            const lines = this.lines;
            if (lines.length > 0) {
                const lastLine = lines[lines.length - 1];
                posx = lastLine.x;
                posy = lastLine.y + lastLine.dynamicMaxHeight;
            }
            if (line.maxWidth > this.pageWidth) {
                console.error('line.maxWidth = ' + line.maxWidth + ', ' + 'this.pageWidth = ' + this.pageWidth);
                return false;//宽度不够
            }
            if (posy + line.dynamicMaxHeight > this.pageHeight) {
                return false;//满了
            }
            //更新数据
            line.x = posx;
            line.y = posy;
            line.page = this;
            this.lines.push(line);
            return true;
        }
    }

    export class Book {

        public readonly _pages: Page[] = [];
        public _sortLines: Line[] = [];

        public addTextBlock(textBlock: TextBlock): boolean {
            const result = this._addTextBlock(textBlock);
            if (!result) {
                return false;
            }
            //没有才要添加
            let exist = false;
            const cast = result as [Page, Line];
            for (const line of this._sortLines) {
                if (line === cast[1]) {
                    exist = true;
                }
            }
            if (!exist) {
                this._sortLines.push(cast[1]);
            }
            //重新排序
            this.sort();
            return true;
        }

        public _addTextBlock(textBlock: TextBlock): [Page, Line] | null {
            if (!textBlock) {
                return null;
            }
            if (textBlock.width > __MAX_PAGE_SIZE__ || textBlock.height > __MAX_PAGE_SIZE__) {
                console.error('textBlock.width = ' + textBlock.width + ', ' + 'textBlock.height = ' + textBlock.height);
                return null;
            }
            //找到最合适的
            const _sortLines = this._sortLines;
            for (let i = 0, length = _sortLines.length; i < length; ++i) {
                const line = _sortLines[i];
                if (!line.isCapacityOf(textBlock)) {
                    continue;
                }
                if (line.addTextBlock(textBlock, false)) {
                    return [line.page, line];
                }
            }
            //做新的行
            const newLine = new Line(__MAX_PAGE_SIZE__);
            if (!newLine.addTextBlock(textBlock, true)) {
                console.error('???');
                return null;
            }
            //现有的page中插入
            const _pages = this._pages;
            for (let i = 0, length = _pages.length; i < length; ++i) {
                const page = _pages[i];
                if (page.addLine(newLine)) {
                    return [page, newLine];
                }
            }
            //都没有，就做新的page
            //添加目标行
            const newPage = this.newPage(__MAX_PAGE_SIZE__, __MAX_PAGE_SIZE__);
            if (!newPage.addLine(newLine)) {
                console.error('_addText newPage.addLine failed');
                return null;
            }
            return [newPage, newLine];
        }

        public newPage(pageWidth: number, pageHeight: number): Page {
            const newPage = new Page(pageWidth, pageHeight);
            this._pages.push(newPage);
            return newPage;
        }

        public sort(): void {
            if (this._sortLines.length <= 1) {
                return;
            }
            const sortFunc = (a: Line, b: Line): number => {
                return (a.dynamicMaxHeight < b.dynamicMaxHeight) ? -1 : 1;
            }
            this._sortLines = this._sortLines.sort(sortFunc);
        }
    }
}

