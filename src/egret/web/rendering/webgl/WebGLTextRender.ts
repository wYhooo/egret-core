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

    interface StyleKey {
        /**
         * 颜色值
         */
        readonly textColor: number;
        /**
         * 描边颜色值
         */
        readonly strokeColor: number;
        /**
         * 字号
         */
        readonly size: number;
        /**
         * 描边大小
         */
        readonly stroke: number;
        /**
         * 是否加粗
         */
        readonly bold: boolean;
        /**
         * 是否倾斜
         */
        readonly italic: boolean;
        /**
         * 字体名称
         */
        readonly fontFamily: string;

        /**
         * ????
         */
        readonly __key__: string;
    }

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

    class CharKey {

        public readonly _char: string = '';
        public readonly _styleKey: StyleKey = {} as StyleKey;
        public readonly _stringKeyValue: string = '';
        public readonly _hashCode: number = 0;

        constructor (char: string, styleKey: StyleKey) {
            this._char = char;
            this._styleKey = styleKey;
            this._stringKeyValue = char + ':' + styleKey.__key__;
            this._hashCode = __hashCode__(this._stringKeyValue);
        }
    }

    class TextAtlasTexture {
        private testHasCode = 0;
        public add(charKey: CharKey): boolean {
            if (!this.testHasCode) {
                console.log(charKey._stringKeyValue + ' | ' + charKey._hashCode);
                this.testHasCode = charKey._hashCode;
                return true;
            }
            return false;
        }
    }

    class TextAtlasTextureCache {

        private readonly textAtlasTextures: TextAtlasTexture[] = [];
        private readonly quickFind: { [index: number]: TextAtlasTexture } = {};

        private create(): TextAtlasTexture {
            const newAtlas = new TextAtlasTexture;
            this.textAtlasTextures.push(newAtlas);
            return newAtlas;
        }

        private addToExist(charKey: CharKey): TextAtlasTexture {
            const textAtlasTextures = this.textAtlasTextures;
            for (let i = 0, length = textAtlasTextures.length; i < length; ++i) {
                const tex = textAtlasTextures[i];
                if (tex.add(charKey)) {
                    return tex;
                }
            }
            return null;
        }

        private markQuickFind(charKey: CharKey, atlas: TextAtlasTexture): void {
            const repeat = this.get(charKey);
            if (repeat) {
                console.error('markQuickFind repeat = ' + charKey._stringKeyValue);
            }
            this.quickFind[charKey._hashCode] = atlas;
        }

        public addAtlas(charKey: CharKey): TextAtlasTexture {
            const findExisting = this.get(charKey);
            if (findExisting) {
                return findExisting;
            }
            const addToExist = this.addToExist(charKey);
            if (addToExist) {
                this.markQuickFind(charKey, addToExist);
                return addToExist;
            }
            const createNew = this.create();
            if (createNew.add(charKey)) {
                this.markQuickFind(charKey, createNew);
                return createNew;
            }
            return null;
        }

        public get(charKey: CharKey): TextAtlasTexture {
            return this.quickFind[charKey._hashCode];
        }
    }

    

    export class WebGLTextRender {
    
        public readonly textAtlasTextureCache: TextAtlasTextureCache = new TextAtlasTextureCache;

        public static render(textNode: sys.TextNode): void {
            if (!__webglTextRender__) {
                return;
            }
            //
            const offset = 4;
            const drawData = textNode.drawData;
            const styleKey = __webglTextRender__.extractStyleKey(textNode);
            //
            let x = 0;
            let y = 0;
            let string = '';
            let style: any = null;
            for (let i = 0, length = drawData.length; i < length; i += offset) {
                x = drawData[i + 0] as number;
                y = drawData[i + 1] as number;
                string = drawData[i + 2] as string;
                style = drawData[i + 3];
                __webglTextRender__.handleString(string, styleKey);
            }
        }

        private handleString(string: string, styleKey: StyleKey): void {
            const textAtlasTextureCache = this.textAtlasTextureCache;
            for (const char of string) {
                const charKey = new CharKey(char, styleKey);
                textAtlasTextureCache.addAtlas(charKey);
            }
        }

        private extractStyleKey(textNode: sys.TextNode): StyleKey {
            return {
                textColor: textNode.textColor,
                strokeColor: textNode.strokeColor,
                size: textNode.size,
                stroke: textNode.stroke,
                bold: textNode.bold,
                italic: textNode.italic,
                fontFamily: textNode.fontFamily,

                __key__: '' + textNode.textColor
                    + '-' + textNode.strokeColor
                    + '-' + textNode.size
                    + '-' + textNode.stroke
                    + '-' + (textNode.bold ? 1 : 0)
                    + '-' + (textNode.italic ? 1 : 0)
                    + '-' + textNode.fontFamily,

            } as StyleKey;
        }
    }

    export const __webglTextRender__ = new WebGLTextRender;
}
