//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-2015, Egret Technology Inc.
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

module egret {
    /**
     * @version Egret 2.0
     * @platform Web,Native
     */
    export class Ticker extends EventDispatcher {
        /**
         * @version Egret 2.0
         * @platform Web,Native
         */
        public constructor(){
            super();
            if (Ticker.instance != null) {
                if (DEBUG) {
                    egret.Logger.fatalWithErrorId(1033);
                }
            }
        }

        /**
         * @private
         */
        private _timeScale:number = 1;
        /**
         * @private
         */
        private _paused:boolean = false;

        /**
         * @deprecated
         * @version Egret 2.0
         * @platform Web,Native
         */
        public run():void {
            if (DEBUG) {
                egret.Logger.fatalWithErrorId(1033);
            }
        }

        /**
         * 注册帧回调事件，同一函数的重复监听会被忽略。
         * @method egret.Ticker#register
         * @param listener {Function} 帧回调函数,参数返回上一帧和这帧的间隔时间。示例：onEnterFrame(frameTime:number):void
         * @param thisObject {any} 帧回调函数的this对象
         * @param priority {number} 事件优先级，开发者请勿传递 Number.NEGATIVE_INFINITY 和 Number.POSITIVE_INFINITY
         * @version Egret 2.0
         * @platform Web,Native
         */
        public register(callBack:Function, thisObject:any, priority:number = 0):void {
            sys.$ticker.$startTick(callBack, thisObject);
        }

        /**
         * 取消侦听enterFrame事件
         * @method egret.Ticker#unregister
         * @param listener {Function} 事件侦听函数
         * @param thisObject {any} 侦听函数的this对象
         * @version Egret 2.0
         * @platform Web,Native
         */
        public unregister(callBack:Function, thisObject:any):void {
            sys.$ticker.$stopTick(callBack, thisObject);
        }

        /**
         * @deprecated
         * @version Egret 2.0
         * @platform Web,Native
         */
        public setTimeScale(scale:number):void {
            if (DEBUG) {
                egret.Logger.fatalWithErrorId(1033);
            }
        }

        /**
         * @deprecated
         * @version Egret 2.0
         * @platform Web,Native
         */
        public getTimeScale():void {
            if (DEBUG) {
                egret.Logger.fatalWithErrorId(1033);
            }
        }

        /**
         * @deprecated
         * @version Egret 2.0
         * @platform Web,Native
         */
        public pause():void {
            if (DEBUG) {
                egret.Logger.fatalWithErrorId(1033);
            }
        }

        /**
         * @deprecated
         * @version Egret 2.0
         * @platform Web,Native
         */
        public resume():void {
            if (DEBUG) {
                egret.Logger.fatalWithErrorId(1033);
            }
        }

        /**
         * @private
         */
        private static instance:egret.Ticker;

        /**
         * @method egret.Ticker.getInstance
         * @returns {Ticker}
         * @version Egret 2.0
         * @platform Web,Native
         */
        public static getInstance():egret.Ticker {
            if (Ticker.instance == null) {
                Ticker.instance = new Ticker();
            }
            return Ticker.instance;
        }
    }
}

module egret.sys {

    /**
     * @private
     * 心跳计时器单例
     */
    export var $ticker:SystemTicker;
    /**
     * @private
     * 是否要广播Event.RENDER事件的标志。
     */
    export var $invalidateRenderFlag:boolean = false;
    /**
     * @private
     * 需要立即刷新屏幕的标志
     */
    export var $requestRenderingFlag:boolean = false;

    /**
     * @private
     * Lark心跳计时器
     */
    export class SystemTicker {

        /**
         * @private
         */
        private lastTime:number = 0;
        /**
         * @private
         */
        public constructor() {
            if (DEBUG && $ticker) {
                $error(1008, "egret.sys.SystemTicker");
            }
            egret.$START_TIME = this.lastTime = Date.now();
        }

        /**
         * @private
         */
        private playerList:Player[] = [];

        /**
         * @private
         * 注册一个播放器实例并运行
         */
        $addPlayer(player:Player):void {
            if (this.playerList.indexOf(player) != -1) {
                return;
            }
            if (DEBUG) {
                lark_stages.push(player.stage);
            }
            this.playerList = this.playerList.concat();
            this.playerList.push(player);
        }

        /**
         * @private
         * 停止一个播放器实例的运行。
         */
        $removePlayer(player:Player):void {
            var index = this.playerList.indexOf(player);
            if (index !== -1) {
                if (DEBUG) {
                    var i = lark_stages.indexOf(player.stage);
                    lark_stages.splice(i, 1);
                }
                this.playerList = this.playerList.concat();
                this.playerList.splice(index, 1);
            }
        }

        /**
         * @private
         */
        private callBackList:Function[] = [];
        /**
         * @private
         */
        private thisObjectList:any[] = [];

        /**
         * @private
         */
        $startTick(callBack:Function, thisObject:any):void {
            var index = this.getTickIndex(callBack, thisObject);
            if (index != -1) {
                return;
            }
            this.concatTick();
            this.callBackList.push(callBack);
            this.thisObjectList.push(thisObject);
        }

        /**
         * @private
         */
        $stopTick(callBack:Function, thisObject:any):void {
            var index = this.getTickIndex(callBack, thisObject);
            if (index == -1) {
                return;
            }
            this.concatTick();
            this.callBackList.splice(index, 1);
            this.thisObjectList.splice(index, 1);
        }

        /**
         * @private
         */
        private getTickIndex(callBack:Function, thisObject:any):number {
            var callBackList = this.callBackList;
            var thisObjectList = this.thisObjectList;
            for (var i = callBackList.length - 1; i >= 0; i--) {
                if (callBackList[i] == callBack &&
                    thisObjectList[i] == thisObject) {//这里不能用===，因为有可能传入undefined和null.
                    return i;
                }
            }
            return -1;
        }

        /**
         * @private
         * 
         */
        private concatTick():void {
            this.callBackList = this.callBackList.concat();
            this.thisObjectList = this.thisObjectList.concat();
        }

        /**
         * @private
         * 全局帧率
         */
        $frameRate:number = 30;

        /**
         * @private
         */
        private frameInterval:number = 1;

        /**
         * @private
         * 设置全局帧率
         */
        $setFrameRate(value:number):void {
            //value = +value || 0;
            if (value <= 0) {
                return;
            }
            if (this.$frameRate == value) {
                return;
            }
            this.$frameRate = value;
            if (value > 60) {
                value = 60;
            }
            //这里用60*1000来避免浮点数计算不准确的问题。
            this.lastCount = this.frameInterval = Math.round(60000 / value);
        }

        /**
         * @private
         */
        private lastCount:number = 1000;

        /**
         * @private
         * 执行一次刷新
         */
        public update():void {
            var callBackList = this.callBackList;
            var thisObjectList = this.thisObjectList;
            var length = callBackList.length;
            var requestRenderingFlag = $requestRenderingFlag;
            var timeStamp = egret.getTimer();
            var advancedTime:number = timeStamp - this.lastTime;
            this.lastTime = timeStamp;

            for (var i = 0; i < length; i++) {
                if (!callBackList[i].call(thisObjectList[i], advancedTime)) {
                    requestRenderingFlag = true;
                }

            }
            this.lastCount -= 1000;
            if (this.lastCount > 0) {
                if (requestRenderingFlag) {
                    this.render(false);
                }
                return;
            }
            this.lastCount += this.frameInterval;
            this.broadcastEnterFrame();
            this.render(true);
        }

        /**
         * @private
         * 执行一次屏幕渲染
         */
        private render(triggerByFrame:boolean):void {
            var playerList = this.playerList;
            var length = playerList.length;
            if (length == 0) {
                return;
            }
            if ($invalidateRenderFlag) {
                this.broadcastRender();
                $invalidateRenderFlag = false;
            }
            for (var i = 0; i < length; i++) {
                playerList[i].$render(triggerByFrame);
            }
            $requestRenderingFlag = false;
        }

        /**
         * @private
         * 广播EnterFrame事件。
         */
        private broadcastEnterFrame():void {
            var list = DisplayObject.$enterFrameCallBackList;
            var length = list.length;
            if (length == 0) {
                return;
            }
            list = list.concat();
            for (var i = 0; i < length; i++) {
                list[i].dispatchEventWith(Event.ENTER_FRAME);
            }
        }

        /**
         * @private
         * 广播Render事件。
         */
        private broadcastRender():void {
            var list = DisplayObject.$renderCallBackList;
            var length = list.length;
            if (length == 0) {
                return;
            }
            list = list.concat();
            for (var i = 0; i < length; i++) {
                list[i].dispatchEventWith(Event.RENDER);
            }
        }
    }
}

if (DEBUG) {
    var lark_stages:egret.Stage[] = [];
}
