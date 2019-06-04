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

namespace egret.web {

    function __hashCode__(str: string): number {
        if (str.length === 0) {
            return 0;
        }
        let hash = 0;
        for (let i = 0, length = str.length; i < length; ++i) {
            const chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    //针对中文的加速查找
    const __chineseCharactersRegExp__ = new RegExp("^[\u4E00-\u9FA5]$");
    const __chineseCharacterMeasureFastMap__: { [index: string]: TextMetrics } = {};

    //
    const kw_tag: string = 'tag';
    const kw_textTextureAtlas: string = 'textTextureAtlas';

    //
    class StyleKey {
        /**
         * 颜色值
         */
        public readonly textColor: number;
        /**
         * 描边颜色值
         */
        public readonly strokeColor: number;
        /**
         * 字号
         */
        public readonly size: number;
        /**
         * 描边大小
         */
        public readonly stroke: number;
        /**
         * 是否加粗
         */
        public readonly bold: boolean;
        /**
         * 是否倾斜
         */
        public readonly italic: boolean;
        /**
         * 字体名称
         */
        public readonly fontFamily: string;

        //
        public readonly font: string;

        public readonly format: sys.TextFormat = null;

        /**
         * ????
         */
        public __string__: string;

        constructor(textNode: sys.TextNode, format: sys.TextFormat) {
            this.textColor = textNode.textColor;
            this.strokeColor = textNode.strokeColor;
            this.size = textNode.size;
            this.stroke = textNode.stroke;
            this.bold = textNode.bold;
            this.italic = textNode.italic;
            this.fontFamily = textNode.fontFamily;
            this.format = format;
            this.font = getFontString(textNode, this.format);

            //
            this.__string__ = '' + this.font;
            const textColor = format.textColor == null ? textNode.textColor : format.textColor;
            const strokeColor = format.strokeColor == null ? textNode.strokeColor : format.strokeColor;
            const stroke = format.stroke == null ? textNode.stroke : format.stroke;
            this.__string__ += '-' + toColorString(textColor);
            this.__string__ += '-' + toColorString(strokeColor);
            if (stroke) {
                this.__string__ += '-' + stroke * 2;
            }
        }
    }

    class CharValue {

        public _char: string = '';
        public _styleKey: StyleKey = null;
        public _string: string = '';
        public _hashCode: number = 0;
        public renderWidth: number = 0;
        public renderHeight: number = 0;

        constructor() {
        }

        public reset(char: string, styleKey: StyleKey): CharValue {
            this._char = char;
            this._styleKey = styleKey;
            this._string = char + ':' + styleKey.__string__;
            this._hashCode = __hashCode__(this._string);
            return this;
        }

        public render(canvas: HTMLCanvasElement): void {
            if (!canvas) {
                return;
            }
            //
            const x = 0;
            const y = 0;
            const text = this._char;
            const format: sys.TextFormat = this._styleKey.format;
            const textColor = format.textColor == null ? this._styleKey.textColor : format.textColor;
            const strokeColor = format.strokeColor == null ? this._styleKey.strokeColor : format.strokeColor;
            const stroke = format.stroke == null ? this._styleKey.stroke : format.stroke;
            //
            const context = egret.sys.getContext2d(canvas);
            //Step1: 重新测试字体大小
            const measureText = this.measureText(context, text, this._styleKey.font);
            if (measureText) {
                this.renderWidth = measureText.width;
                this.renderHeight = (measureText['height'] || this._styleKey.size);
            }
            else {
                console.error('text = ' + text + ', measureText is null');
                this.renderWidth = this._styleKey.size;
                this.renderHeight = this._styleKey.size;
            }
            //
            canvas.width = this.renderWidth;
            canvas.height = this.renderHeight;
            //再开始绘制
            context.save();
            context.textAlign = "start";
            context.textBaseline = "top";
            context.lineJoin = "round";
            context.font = this._styleKey.font;
            context.fillStyle = toColorString(textColor);
            context.strokeStyle = toColorString(strokeColor);
            context.clearRect(0, 0, this.renderWidth, this.renderHeight);
            context.translate(0, 0);
            context.scale(1, 1);
            //
            if (stroke) {
                context.lineWidth = stroke * 2;
                context.strokeText(text, x, y);
            }
            context.fillText(text, x, y);
            context.restore();
        }

        private measureText(context: CanvasRenderingContext2D, text: string, font: string): TextMetrics {
            const isChinese = __chineseCharactersRegExp__.test(text);
            if (isChinese) {
                if (__chineseCharacterMeasureFastMap__[font]) {
                    return __chineseCharacterMeasureFastMap__[font];
                }
            }
            context.font = font;
            const measureText = context.measureText(text);
            if (isChinese) {
                __chineseCharacterMeasureFastMap__[font] = measureText;
            }
            return measureText;
        }
    }

    export class TextAtlasRender extends HashObject {

        public static render(textNode: sys.TextNode): void {
            if (!textNode) {
                return;
            }
            //先配置这个模型
            if (!__book__) {
                configTextTextureAtlas(64, 2);
            }
            //
            const offset = 4;
            const drawData = textNode.drawData;
            let x = 0;
            let y = 0;
            let labelString = '';
            let format: sys.TextFormat = {};
            for (let i = 0, length = drawData.length; i < length; i += offset) {
                x = drawData[i + 0] as number;
                y = drawData[i + 1] as number;
                labelString = drawData[i + 2] as string;
                format = drawData[i + 3] as sys.TextFormat || {};
                const styleKey = new StyleKey(textNode, format);
                __textAtlasRender__.handleLabelString(labelString, styleKey);
            }
        }

        private readonly $charValue = new CharValue;
        private readonly _textBlockMap: { [index: number]: TextBlock } = {};
        private handleLabelString(labelstring: string, styleKey: StyleKey): void {
            const canvas = this.canvas;
            const $charValue = this.$charValue;
            const _textBlockMap = this._textBlockMap;
            for (const char of labelstring) {
                //不反复创建
                $charValue.reset(char, styleKey);
                if (_textBlockMap[$charValue._hashCode]) {
                    //检查重复
                    continue;
                }
                //尝试渲染到canvas
                $charValue.render(canvas);
                console.log(char + ':' + canvas.width + ', ' + canvas.height);
                //创建新的文字块
                const newTxtBlock = new TextBlock($charValue.renderWidth, $charValue.renderHeight);
                if (!__book__.addTextBlock(newTxtBlock)) {
                    //走到这里几乎是不可能的，除非内存分配没了
                    //暂时还没有到提交纹理的地步，现在都是虚拟的
                    console.error('__book__.addTextBlock ??');
                    continue;
                }
                //记录
                _textBlockMap[$charValue._hashCode] = newTxtBlock;
                //测试下
                newTxtBlock[kw_tag] = char;
                //
                const line = newTxtBlock.line;
                const page = line.page;
                const xoffset = line.x + newTxtBlock.x + __TXT_RENDER_BORDER__;
                const yoffset = line.y + newTxtBlock.y + __TXT_RENDER_BORDER__;
                if (!page[kw_textTextureAtlas]) {
                    page[kw_textTextureAtlas] = this.createTextTextureAtlas(page.pageWidth, page.pageHeight);
                }
                const textAtlas = page[kw_textTextureAtlas] as WebGLTexture; 
                const gl = web.WebGLRenderContext.getInstance(0, 0).context;
                gl.bindTexture(gl.TEXTURE_2D, textAtlas);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, xoffset, yoffset, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            }
        }

        private readonly textAtlasTextureCache: WebGLTexture[] = [];
        private createTextTextureAtlas(width: number, height: number): WebGLTexture {
            const canvas = egret.sys.createCanvas(width, height);
            const context = egret.sys.getContext2d(canvas);
            context.fillStyle = 'black';
            context.fillRect(0, 0, width, height);
            const textAtlasTexture = web.WebGLRenderContext.getInstance(0, 0).createTexture(canvas);
            textAtlasTexture['text_atlas'] = true;
            this.textAtlasTextureCache.push(textAtlasTexture);
            return textAtlasTexture;
        }

        private _canvas: HTMLCanvasElement = null;
        public get canvas(): HTMLCanvasElement {
            const size = 24;
            this._canvas = this._canvas || egret.sys.createCanvas(size, size);
            return this._canvas;
        }
    }

    export const __textAtlasRender__ = new TextAtlasRender;
}
