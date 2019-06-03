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

const __TEXT_RENDER_OFFSET__ = 1;

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
    const __ChineseCharactersRegExp__ = new RegExp("^[\u4E00-\u9FA5]$");
    const __ChineseCharacterMeasureFastMap__: { [index: string]: TextMetrics } = {};

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

        public readonly _char: string;
        public readonly _styleKey: StyleKey;
        public readonly _string: string;
        public readonly _hashCode: number;
        public renderWidth: number = 0;
        public renderHeight: number = 0;

        constructor(char: string, styleKey: StyleKey) {
            this._char = char;
            this._styleKey = styleKey;
            this._string = char + ':' + styleKey.__string__;
            this._hashCode = __hashCode__(this._string);
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
            context.textAlign = "left";
            context.textBaseline = "middle";
            context.lineJoin = "round";
            context.font = this._styleKey.font;
            context.fillStyle = toColorString(textColor);
            context.strokeStyle = toColorString(strokeColor);
            //重新测试字体大小
            const measureText = this.measureText(context, text, context.font);
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
            //
            if (stroke) {
                context.lineWidth = stroke * 2;
                context.strokeText(text, x, y);
            }
            context.fillText(text, x, y);
        }

        private measureText(context: CanvasRenderingContext2D, text: string, font: string): TextMetrics {
            const isChinese = __ChineseCharactersRegExp__.test(text);
            if (isChinese) {
                if (__ChineseCharacterMeasureFastMap__[font]) {
                    return __ChineseCharacterMeasureFastMap__[font];
                }
            }
            context.font = font;
            const measureText = context.measureText(text);
            if (isChinese) {
                __ChineseCharacterMeasureFastMap__[font] = measureText;
            }
            return measureText;
        }
    }



    class TextAtlasTexture {
        public name: string = '';
    }

    class TextAtlasTextureCache {
        private readonly pool: TextAtlasTexture[] = [];
    }

    export class WebGLTextRender {

        public readonly textAtlasTextureCache: TextAtlasTextureCache = new TextAtlasTextureCache;

        public static render(textNode: sys.TextNode): void {
            if (!textNode) {
                return;
            }
            //先配置这个模型
            configTextureAtlasBookModel(128 * 2, __TEXT_RENDER_OFFSET__);
            //
            const offset = 4;
            const drawData = textNode.drawData;
            let x = 0;
            let y = 0;
            let labelString = '';
            let format: sys.TextFormat = {};

            for (let i = 0, length = drawData.length; i < length; i += offset) {
                //
                x = drawData[i + 0] as number;
                y = drawData[i + 1] as number;
                labelString = drawData[i + 2] as string;
                format = drawData[i + 3] as sys.TextFormat || {};
                //
                const styleKey = new StyleKey(textNode, format);
                __webglTextRender__.handleLabelString(labelString, styleKey);
            }
        }

        private handleLabelString(labelstring: string, styleKey: StyleKey): void {
            const canvas = this.canvas;
            for (const char of labelstring) {
                const charValue = new CharValue(char, styleKey);
                charValue.render(canvas);
                console.log(char + ':' + canvas.width + ', ' + canvas.height);
            }
        }

        private _canvas: HTMLCanvasElement = null;
        public get canvas(): HTMLCanvasElement {
            if (!this._canvas) {
                const size = 16;
                this._canvas = egret.sys.createCanvas(size, size);
            }
            return this._canvas;
        }
    }

    export const __webglTextRender__ = new WebGLTextRender;
}
