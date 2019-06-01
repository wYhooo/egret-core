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
        readonly key: string;
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
    };

    function __charWithStyleKey__(char: string, styleKey: StyleKey): string {
        return char + ':' + styleKey.key;
    };

    class TextAtlasTexture {

        private testHasCode = 0;

        public add(charWithStyleKey: string, hash: number): boolean {
            if (!this.testHasCode) {
                console.log('charWithStyleKey = ' + charWithStyleKey + ':' + hash);
                this.testHasCode = hash;
                return true;
            }
            return false;
        }
    }

    class TextAtlasTextureCache {

        private readonly textAtlasTextures: TextAtlasTexture[] = [];
        private readonly finder: { [index: number]: TextAtlasTexture } = {};

        private createTextAtlasTexture(): TextAtlasTexture {
            const textAtlasTexture = new TextAtlasTexture;
            this.textAtlasTextures.push(textAtlasTexture);
            return textAtlasTexture;
        }

        private addToExistingAtlas(charWithStyleKey: string, hash: number): TextAtlasTexture {
            const textAtlasTextures = this.textAtlasTextures;
            for (let i = 0, length = textAtlasTextures.length; i < length; ++i) {
                const tex = textAtlasTextures[i];
                if (tex.add(charWithStyleKey, hash)) {
                    return tex;
                }
            }
            return null;
        }

        private addToFinder(charWithStyleKey: string, hash: number, atlas: TextAtlasTexture): void {
            const repeat = this.getAtlas(charWithStyleKey, hash);
            if (repeat) {
                console.error('add to atlas finder repeat = ' + charWithStyleKey);
            }
            this.finder[hash] = atlas;
        }

        public addAtlas(charWithStyleKey: string, hash: number): TextAtlasTexture {
            const findExisting = this.getAtlas(charWithStyleKey, hash);
            if (findExisting) {
                return findExisting;
            }
            const addToExisting = this.addToExistingAtlas(charWithStyleKey, hash);
            if (addToExisting) {
                this.addToFinder(charWithStyleKey, hash, addToExisting);
                return addToExisting;
            }
            const createNew = this.createTextAtlasTexture();
            if (createNew.add(charWithStyleKey, hash)) {
                this.addToFinder(charWithStyleKey, hash, createNew);
                return createNew;
            }
            return null;
        }

        public getAtlas(charWithStyleKey: string, hash: number): TextAtlasTexture {
            return this.finder[hash];
        }
    }

    export class WebGLTextRender {

        public readonly textAtlasTextureCache: TextAtlasTextureCache = new TextAtlasTextureCache;

        public catch(textNode: sys.TextNode): void {
            //
            const offset = 4;
            const drawData = textNode.drawData;
            const styleKey = this.extractStyleKey(textNode);
            //
            let x = 0;
            let y = 0;
            let string = '';
            let style: egret.ITextStyle = null;
            for (let i = 0, length = drawData.length; i < length; i += offset) {
                x = drawData[i + 0] as number;
                y = drawData[i + 1] as number;
                string = drawData[i + 2] as string;
                style = drawData[i + 3] as egret.ITextStyle;
                this.handle(string, styleKey);
            }
        }

        private addAtlas(charWithStyleKey: string, hash: number): TextAtlasTexture {
            return this.textAtlasTextureCache.addAtlas(charWithStyleKey, hash);
        }

        private handle(string: string, styleKey: StyleKey): void {
            let charWithStyleKey = '';
            let hash = 0;
            for (const s of string) {
                charWithStyleKey = __charWithStyleKey__(s, styleKey);
                hash = __hashCode__(charWithStyleKey);
                this.addAtlas(charWithStyleKey, hash);
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

                key: '' + textNode.textColor
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
