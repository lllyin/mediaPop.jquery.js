/**
 *  created by ling on 2017-12-20 15:07.
 */

/*
* author:ling
* date:2017-12-30
* 创建媒体（音频、视频播放弹出层及处理）;
*
* */

(function ($, window, undefined) {

    var $MASK,          //弹出层蒙版
        $POPBOX,        //弹出层box
        $POPCONTENT;        //弹出层内容

    var StoreEvents = {};    //发布订阅者模式，保存回调事件

    //工具集
    var lyin = {
        //将以秒为单位的时间转换为时分秒
        secondToTime: function (second) {
            if (typeof second !== "number") {
                return
            };
            var time = {
                h: 0,    //时
                m: 0,    //分
                s: 0,     //秒
                timeStr: ""  //时间字符串
            };
            if (second <= 60) {
                time.s = second;
                time.timeStr = second + 's';
            }
            if (second > 60 && second < 3600) {
                time.m = Math.floor(second / 60);
                time.s = second % 60;
                time.timeStr = time.m + ":" + time.s;
            }
            if (second >= 3600) {
                var newTimeObj = lyin.secondToTime(second % 3600);
                time.h = Math.floor(second / 3600);
                time.m = newTimeObj.m;
                time.s = newTimeObj.s;
                time.timeStr = time.h + ":" + time.m + ":" + time.s;
            }

            return time;
        },

        //获取媒体的时间长度
        getMediaDuration:function(src){
            var obj = new Audio();
            obj.src = src;

            return obj.duration;

        },

        //订阅时间
        listen:function(event,callback){
            if(StoreEvents[event]){
                StoreEvents[event].push(callback);
            }else{
                StoreEvents[event] = [];
                StoreEvents[event].push(callback);
            }
            console.log(StoreEvents);
        },

        //发布事件
        emit:function (event) {
           for(var evt in StoreEvents){
               if(event === evt){
                   StoreEvents[event].forEach(function (func) {
                       func();
                   })
               }
           }
        },

        //将音视频与进度条绑定
        bindRange: function (mediaObj, rangeObj) {
            // console.log(mediaObj,rangeObj);
            var sit = null; //定时器
            var mediaTime = 0;      //媒体总时长
            var mediaPlayedTime = 0;  //媒体已播放时长
            var isDwom = false;        //鼠标是否按下
            var pointPositionX = 0;     //播放按钮位置
            var rangeOFL = 0;       //控制条距屏幕左侧距离
            var oMediaObj = mediaObj[0];        //媒体 dom 对象
            var oRangeObj = rangeObj[0];    //orange dom 对象
            var oRangeWidth = rangeObj.width();     //range宽度
            this._togglePlayBtn = $(rangeObj).parents(".audio-ctrl").find(".audio-icon");   //将播放按钮注册为lyin全局对象

            //移动进度条
            function _moveRange(position) {
                if (position <= 0) {
                    position = 0;
                }
                if (position >= 1) {
                    position = 1;
                }
                rangeObj.find("span:first-child").css("width", position * 100 + "%");
                rangeObj.find("span:last-child").css("left", position * 100 + "%");
            }

            //媒体加载完成
            oMediaObj.addEventListener("canplay",function () {
                mediaTime = Math.round(oMediaObj.duration);

            });
            //媒体播放
            oMediaObj.addEventListener("playing",function () {
                console.log("我开始播放了");
                if(oMediaObj.currentTime >= mediaTime){
                    oMediaObj.load()
                }
                sit = setInterval(function () {
                    mediaPlayedTime = Math.round(oMediaObj.played.end(0));
                    mediaCurrentTime = Math.round(oMediaObj.currentTime);
                    pointPositionX = mediaCurrentTime / mediaTime;
                    // console.log("已播放事件", oMediaObj.currentTime, mediaPlayedTime)
                    _moveRange(pointPositionX);
                    console.log("定时器")
                    // console.log(mediaPlayedTime,pointPositionX)
                }, 50)
            });
            //媒体暂停
            oMediaObj.addEventListener("pause",function () {
                console.log("我被暂停了");
                clearInterval(sit);
                lyin.mediaPauseTodo();
            });
            oMediaObj.addEventListener("ended",function () {
                console.log("音频播放完毕");
                clearInterval(sit);
                lyin.mediaPauseTodo();
            });

            //进度条被拖放
            $(oRangeObj).on("mousedown",function(){
                isDwom = true;
                rangeOFL = $(this).offset().left;
            });
            $("body").on("mouseup", function () {
                isDwom = false;
                console.log("定位时间：", pointPositionX * mediaTime);
                oMediaObj.currentTime = (pointPositionX * mediaTime <= 0) ? 0 : pointPositionX * mediaTime;
                clearInterval(sit);
            });
            window.addEventListener("mousemove",function(e){
                if (!isDwom) {
                    return
                }
                pointPositionX = (e.pageX - rangeOFL) / oRangeWidth;
                _moveRange(pointPositionX);

                // console.log(e.pageX - rangeOFL, pointPositionX);
            })
        },

        //控制音视频的播放与暂停
        togglePlay:function (media) {
            // console.log(media)
            var _this = this;
            this._togglePlayBtn = this;
            this._media = media;
            if(media.paused){
                media.play();
                this.addClass("play").removeClass("pause");
            }else{
                media.pause();
                this.addClass("pause").removeClass("play");
            }
        },

        //媒体结束,暂停要做的事情
        mediaPauseTodo:function(){
            this._togglePlayBtn.addClass("pause").removeClass("play");

        },
        //媒体播放要做的事情
        mediaPlayTodo:function () {
            this._togglePlayBtn.addClass("play").removeClass("pause");
        }

    };

    //初始化弹出层
    function init() {
        $MASK = $("<div class='ly-mask hide'></div>");
        var BOXHTML = "";
        BOXHTML += '<div class="pop-box media-box">';
        BOXHTML += '<div class="media-title"> ';
        BOXHTML += '    这是媒体标题';
        BOXHTML += '</div> ';
        BOXHTML += '<div class="pop"> ';
        BOXHTML += '</div>';
        BOXHTML += '<div class="btn ly-close"></div>';
        BOXHTML += '</div>';

        $MASK.append(BOXHTML);
        $("body").append($MASK);

        // pop box close
        $(".ly-close").on("click", function () {
            lyin.emit("popClose");
        });

        $POPBOX = $MASK.find(".pop-box");
        $POPCONTENT = $MASK.find(".pop");

    }

    //监听弹出层关闭
    lyin.listen("popClose",function () {
        $(".ly-mask").fadeOut("fast").addClass("hide");
        $MASK.find("audio").pause();
        $MASK.find("video").pause();
    });


    //播放音频
    function genAudio(audioSrc, audioTitle) {

        var mediaDuration = lyin.getMediaDuration(audioSrc);
        var mediaDurationHuman = lyin.secondToTime(mediaDuration);

        var $audioContent = "<div class='audio-ctrl'><div class='audio-icon play'></div>" +
            " <div class='box'><h3 class='audio-title'>" + audioTitle + "<span>" + mediaDurationHuman.timeStr +
            "</span></span></h3><audio autoplay src=" + audioSrc + ">您的浏览器不支持播放音视频，请换用其他浏览器~</audio>" +
            "<div class='range-bar'><span id='progress'></span><span id='icon-btn'></span></span></div></div>";
        $MASK.find(".media-title").text('');
        $POPCONTENT.html($audioContent).parent(".pop-box").attr("data-role", "audio-box");

        var $popAudio = $(".audio-ctrl audio"); //音频对象
        var $rangeObj = $(".audio-ctrl .range-bar");

        lyin.bindRange($popAudio, $rangeObj);

        $(".audio-ctrl .audio-icon").click(function () {
            $(this).togglePlay($popAudio[0])
        });

        return $MASK;
    }

    //播放视频
    function genVedio(vedioSrc, vedioTitle) {
        var $videoContent = '<video controls autoplay src="' + vedioSrc + '"</video>';
        $POPCONTENT.html($videoContent).parent(".pop-box").attr("data-role", "video-box");
        $MASK.find(".media-title").text(vedioTitle);

        return $MASK;
    }

    function showMask() {
        var _this = (this.nodeType === 1) ? this : $MASK;
        _this.removeClass("hide").fadeIn("fast");
    }

    function hideMask() {
        var _this = (this.nodeType === 1) ? this : $MASK;
        _this.addClass("hide").fadeOut("fast");
    }


    $.fn.showMASK = showMask;
    $.fn.hideMask = hideMask;

    lyin.genAudio = genAudio;
    lyin.genVedio = genVedio;


    //页面加载就绪
    $(function () {
        init();
    });

    window.lyin2 = lyin;

})(jQuery, window, undefined);

