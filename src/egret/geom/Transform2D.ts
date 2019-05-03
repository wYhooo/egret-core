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

    export class Transform2D {

        public readonly worldTransform: Matrix = new Matrix;
        public readonly localTransform: Matrix = new Matrix;
        public _localID: number = 0;
        public _currentLocalID: number = 0;
        public _worldID: number = 0;
        public _parentID: number = 0;
        public __$offsetX__: number = 0;
        public __$offsetY__: number = 0;

        constructor() {
        }

        /**
         * Updates only local matrix
         */
        updateLocalTransform(displayObject: DisplayObject) {
            const sm = displayObject.$getMatrix();
            const lm = this.localTransform;
            lm.setTo(sm.a, sm.b, sm.c, sm.d, sm.tx, sm.ty);

            if (this._localID !== this._currentLocalID) {
                this._currentLocalID = this._localID;
                // force an update..
                this._parentID = -1;
            }
        }

        public updateTransform(displayObject: DisplayObject, parentTransform: Transform2D): void {
            this.updateLocalTransform(displayObject);
            //this.world = parent.world * this.local
            this.__$offsetX__ = parentTransform.__$offsetX__ + displayObject.$x;
            this.__$offsetY__ = parentTransform.__$offsetY__ + displayObject.$y;
            //
            const wt = parentTransform.worldTransform;
            const lt = this.localTransform;//this.$getMatrix();
            const worldtransform = this.worldTransform;
            if (displayObject.$useTranslate) {
                worldtransform.a = lt.a * wt.a + lt.b * wt.c;
                worldtransform.b = lt.a * wt.b + lt.b * wt.d;
                worldtransform.c = lt.c * wt.a + lt.d * wt.c;
                worldtransform.d = lt.c * wt.b + lt.d * wt.d;
                worldtransform.tx = this.__$offsetX__ * wt.a + this.__$offsetY__ * wt.c + wt.tx;
                worldtransform.ty = this.__$offsetX__ * wt.b + this.__$offsetY__ * wt.d + wt.ty;
                this.__$offsetX__ = -displayObject.$anchorOffsetX;
                this.__$offsetY__ = -displayObject.$anchorOffsetY;
            }
            else {
                worldtransform.a = wt.a;
                worldtransform.b = wt.b;
                worldtransform.c = wt.c;
                worldtransform.d = wt.d;
                // worldtransform.tx = 0;
                // worldtransform.ty = 0;
                this.__$offsetX__ += -displayObject.$anchorOffsetX;
                this.__$offsetY__ += -displayObject.$anchorOffsetY;
            }



            //const lt = this.localTransform;
            if (this._parentID !== parentTransform._worldID) {
                /*
                // concat the parent matrix with the objects transform.
                const pt = parentTransform.worldTransform;
                const wt = this.worldTransform;

                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
                */
                
                this._parentID = parentTransform._worldID;
                // update the id of the transform..
                ++this._worldID;
            }
        }

        /**
         * Decomposes a matrix and sets the transforms properties based on it.
         *
         * @param {PIXI.Matrix} matrix - The matrix to decompose
         */
        // setFromMatrix(matrix) {
        //     matrix.decompose(this);
        //     this._localID++;
        // }

        /**
         * The rotation of the object in radians.
         *
         * @member {number}
         */
        // get rotation() {
        //     return this._rotation;
        // }

        // set rotation(value) // eslint-disable-line require-jsdoc
        // {
        //     if (this._rotation !== value) {
        //         this._rotation = value;
        //         this.updateSkew();
        //     }
        // }
    }

    //Transform.IDENTITY = new Transform();
}