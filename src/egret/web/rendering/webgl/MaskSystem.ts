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

    /** !!!!!!!! inspired by pixi !!!!!!!!!!!!!
    */
    export class MaskSystem {

        private readonly _webglRenderContext: WebGLRenderContext;

        constructor(webglRenderContext: WebGLRenderContext) {
            this._webglRenderContext = webglRenderContext;
            // super(renderer);

            // // TODO - we don't need both!
            // /**
            //  * `true` if current pushed masked is scissor
            //  * @member {boolean}
            //  * @readonly
            //  */
            // this.scissor = false;

            // /**
            //  * Mask data
            //  * @member {PIXI.Graphics}
            //  * @readonly
            //  */
            // this.scissorData = null;

            // /**
            //  * Target to mask
            //  * @member {PIXI.DisplayObject}
            //  * @readonly
            //  */
            // this.scissorRenderTarget = null;

            // /**
            //  * Enable scissor
            //  * @member {boolean}
            //  * @readonly
            //  */
            // this.enableScissor = false;

            // /**
            //  * Pool of used sprite mask filters
            //  * @member {PIXI.SpriteMaskFilter[]}
            //  * @readonly
            //  */
            // this.alphaMaskPool = [];

            // /**
            //  * Current index of alpha mask pool
            //  * @member {number}
            //  * @default 0
            //  * @readonly
            //  */
            // this.alphaMaskIndex = 0;
        }

        /**
         * Applies the Mask and adds it to the current filter stack.
         *
         * @param {PIXI.DisplayObject} target - Display Object to push the mask to
         * @param {PIXI.Sprite|PIXI.Graphics} maskData - The masking data.
         */
        push(target: DisplayObject, renderTargetRoot: WebGLRenderBuffer,
            offsetX: number, offsetY: number, _drawAdvancedTargetData: IDrawAdvancedTargetData) {
                console.log('mask system push');
            // TODO the root check means scissor rect will not
            // be used on render textures more info here:
            // https://github.com/pixijs/pixi.js/pull/3545

            // if (maskData.isSprite) {
            //     this.pushSpriteMask(target, maskData);
            // }
            // else if (this.enableScissor
            //     && !this.scissor
            //     && this.renderer._activeRenderTarget.root
            //     && !this.renderer.stencil.stencilMaskStack.length
            //     && maskData.isFastRect()) {
            //     const matrix = maskData.worldTransform;

            //     let rot = Math.atan2(matrix.b, matrix.a);

            //     // use the nearest degree!
            //     rot = Math.round(rot * (180 / Math.PI));

            //     if (rot % 90) {
            //         this.pushStencilMask(maskData);
            //     }
            //     else {
            //         this.pushScissorMask(target, maskData);
            //     }
            // }
            // else {
            //     this.pushStencilMask(maskData);
            // }
        }

        /**
         * Removes the last mask from the mask stack and doesn't return it.
         *
         * @param {PIXI.DisplayObject} target - Display Object to pop the mask from
         * @param {PIXI.Sprite|PIXI.Graphics} maskData - The masking data.
         */
        pop(/*target, maskData*/) {
            console.log('mask system pop');
            // if (maskData.isSprite) {
            //     this.popSpriteMask(target, maskData);
            // }
            // else if (this.enableScissor && !this.renderer.stencil.stencilMaskStack.length) {
            //     this.popScissorMask(target, maskData);
            // }
            // else {
            //     this.popStencilMask(target, maskData);
            // }
        }

        // /**
        //  * Applies the Mask and adds it to the current filter stack.
        //  *
        //  * @param {PIXI.RenderTexture} target - Display Object to push the sprite mask to
        //  * @param {PIXI.Sprite} maskData - Sprite to be used as the mask
        //  */
        // pushSpriteMask(target, maskData) {
        //     let alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];

        //     if (!alphaMaskFilter) {
        //         alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter(maskData)];
        //     }

        //     alphaMaskFilter[0].resolution = this.renderer.resolution;
        //     alphaMaskFilter[0].maskSprite = maskData;

        //     const stashFilterArea = target.filterArea;

        //     target.filterArea = maskData.getBounds(true);
        //     this.renderer.filter.push(target, alphaMaskFilter);
        //     target.filterArea = stashFilterArea;

        //     this.alphaMaskIndex++;
        // }

        // /**
        //  * Removes the last filter from the filter stack and doesn't return it.
        //  *
        //  */
        // popSpriteMask() {
        //     this.renderer.filter.pop();
        //     this.alphaMaskIndex--;
        // }

        // /**
        //  * Applies the Mask and adds it to the current filter stack.
        //  *
        //  * @param {PIXI.Sprite|PIXI.Graphics} maskData - The masking data.
        //  */
        // pushStencilMask(maskData) {
        //     this.renderer.batch.flush();
        //     this.renderer.stencil.pushStencil(maskData);
        // }

        // /**
        //  * Removes the last filter from the filter stack and doesn't return it.
        //  *
        //  */
        // popStencilMask() {
        //     // this.renderer.currentRenderer.stop();
        //     this.renderer.stencil.popStencil();
        // }

        // /**
        //  *
        //  * @param {PIXI.DisplayObject} target - Display Object to push the mask to
        //  * @param {PIXI.Graphics} maskData - The masking data.
        //  */
        // pushScissorMask(target, maskData) {
        //     maskData.renderable = true;

        //     const renderTarget = this.renderer._activeRenderTarget;

        //     const bounds = maskData.getBounds();

        //     bounds.fit(renderTarget.size);
        //     maskData.renderable = false;

        //     this.renderer.gl.enable(this.renderer.gl.SCISSOR_TEST);

        //     const resolution = this.renderer.resolution;

        //     this.renderer.gl.scissor(
        //         bounds.x * resolution,
        //         (renderTarget.root ? renderTarget.size.height - bounds.y - bounds.height : bounds.y) * resolution,
        //         bounds.width * resolution,
        //         bounds.height * resolution
        //     );

        //     this.scissorRenderTarget = renderTarget;
        //     this.scissorData = maskData;
        //     this.scissor = true;
        // }

        // /**
        //  * Pop scissor mask
        //  *
        //  */
        // popScissorMask() {
        //     this.scissorRenderTarget = null;
        //     this.scissorData = null;
        //     this.scissor = false;

        //     // must be scissor!
        //     const { gl } = this.renderer;

        //     gl.disable(gl.SCISSOR_TEST);
        // }
    }
}