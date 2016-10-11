// ==UserScript==
// @version         0.0.1
// @name            Block YouTube Videos
// @namespace       https://github.com/ParticleCore
// @description     YouTube less annoying
// @icon            https://raw.githubusercontent.com/ParticleCore/Ebony/gh-pages/images/YTBV%2Bicon.png
// @match           *://www.youtube.com/*
// @exclude         *://www.youtube.com/tv*
// @exclude         *://www.youtube.com/embed/*
// @exclude         *://www.youtube.com/live_chat*
// @run-at          document-start
// @downloadURL     https://github.com/ParticleCore/Ebony/raw/master/src/Userscript/YouTubeBlacklist.user.js
// @homepageURL     https://github.com/ParticleCore/Ebony
// @supportURL      https://github.com/ParticleCore/Ebony/wiki
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UMVQJJFG4BFHW
// @grant           GM_getValue
// @grant           GM_setValue
// @noframes
// ==/UserScript==
(function () {
    "use strict";
    function inject(is_userscript) {
        function addToBlacklist(event) {
            event.preventDefault();
            document.body.appendChild(blacklist_button);
            console.log(this.details);
            blocked_channels[this.details.ucid] = this.details.brand;
            blacklist();
        }
        function positionBlacklistButton(event) {
            if (event.type === "mouseover" && !this.contains(blacklist_button)) {
                blacklist_button.details = this.details;
                this.appendChild(blacklist_button);
            }
        }
        function cleanEmptyContainers() {
            var i, temp, child, parent, container;
            container = document.querySelectorAll(".feed-item-container");
            i = container.length;
            while (i--) {
                if (ignore.containers.indexOf(container[i]) < 0) {
                    temp = container[i].querySelectorAll("ul");
                    if (temp.length < 2) {
                        child = container[i];
                        while (child) {
                            parent = child.parentNode;
                            if (parent.childElementCount > 1) {
                                child.outerHTML = "";
                                break;
                            }
                            child = parent;
                        }
                        console.log("x");
                    } else {
                        ignore.containers.push(container[i]);
                    }
                }
            }
            console.log(52, ignore.containers.length);
        }
        function getVideos(added_nodes) {
            var i, temp, ucid, found, child, parent, videos, details, button, up_next;
            details = {};
            up_next = document.querySelector(".autoplay-bar");
            videos = document.querySelectorAll(
                // main, trending, subscription, search
                ".yt-lockup-video," +
                ".yt-lockup-channel," +
                ".yt-lockup-playlist," +
                // related
                ".related-list-item"
            );
            i = videos.length;
            while (i--) {
                if (ignore.videos.indexOf(videos[i]) < 0) {
                    temp = videos[i].querySelector(
                        ".content-wrapper [data-ytid]," +
                        ".yt-lockup-content [data-ytid]"
                    );
                    if (temp && temp.dataset.ytid) {
                        details[temp.dataset.ytid] = temp.textContent;
                        ucid = temp.dataset.ytid;
                    } else if (!temp) {
                        // if no UCID  then channel is YouTube
                        temp = videos[i].querySelector(".attribution");
                        if (temp) {
                            details.YouTube = "YouTube";
                            ucid = "YouTube";
                        }
                    }
                    if (ucid && blocked_channels[ucid]) {
                        found = true;
                        if (up_next && up_next.contains(videos[i])) {
                            up_next.parentNode.outerHTML = "";
                            up_next = document.querySelector(".watch-sidebar-separation-line");
                            if (up_next) {
                                up_next.outerHTML = "";
                                up_next = false;
                            }
                        } else {
                            child = videos[i];
                            while (child) {
                                parent = child.parentNode;
                                if (parent.childElementCount > 1) {
                                    console.log(blocked_channels[ucid]);
                                    child.outerHTML = "";
                                    break;
                                }
                                child = parent;
                            }
                        }
                    } else {
                        if (ucid) {
                            temp = videos[i].querySelector(
                                ".yt-pl-thumb," +
                                ".thumb-wrapper," +
                                ".yt-lockup-thumbnail"
                            );
                            if (temp && !temp.details && details) {
                                temp.details = {
                                    ucid: ucid,
                                    brand: details[ucid]
                                };
                                temp.addEventListener("mouseover", positionBlacklistButton);
                                temp.addEventListener("mouseleave", positionBlacklistButton);
                            }
                        }
                        ignore.videos.push(videos[i]);
                    }
                }
            }
            if (found) {
                if (window.location.pathname.match(/^\/($|feed\/)/)) {
                    cleanEmptyContainers();
                }
                window.dispatchEvent(new Event("resize"));
            }
            console.log(140, details, ignore.videos.length);
        }
        function loadMore(mutation) {
            var observer, load_more_button;
            load_more_button = document.querySelector(
                "#watch-more-related," +   // related sidebar
                "#browse-items-primary," + // subscriptions page
                "#feed-main-what_to_watch" // home or trending page
            );
            if (load_more_button && (!loadMore.button || !loadMore.button.contains(load_more_button))) {
                loadMore.button = load_more_button;
                observer = new MutationObserver(blacklist);
                observer.observe(load_more_button, {childList: true, subtree: true});
            }
            console.log(154);
        }
        function blacklist(event, observer) {
            var i, temp;
            console.log(157, event && event.type || observer);
            if (!window.location.pathname.match(/^\/($|feed\/|watch|results|shared)/)) {
                return;
            }
            if (!ignore || !event || event.type === "spfdone") {
                ignore = {
                    videos: [],
                    containers: []
                };
            }
            if (!blacklist_button) {
                blacklist_button = document.createElement("button");
                blacklist_button.className = "bytc-add-to-blacklist";
                blacklist_button.addEventListener("click", addToBlacklist, true);
                document.body.appendChild(blacklist_button);
            }
            if (observer) {
                i = event.length;
                console.log(192, event);
                while (i--) {
                    if (event[i].addedNodes.length > 1) {
                        console.log(195, event[i].addedNodes.length);
                        getVideos();
                    }
                }
            } else if (!event || event.type === "spfdone" || document.readyState !== "complete") {
                console.log(199);
                getVideos();
                loadMore();
            }
        }

        var ignore, blocked_channels, blacklist_button;
        blocked_channels = {};

        document.addEventListener("readystatechange", blacklist);
        document.addEventListener("spfdone", blacklist);
    }
    function contentScriptMessages() {
        var key1, key2, gate, sets, locs, observer;
        key1 = "ebonysend";
        key2 = "getlocale";
        gate = document.documentElement;
        sets = gate.dataset[key1] || null;
        locs = gate.dataset[key2] || null;
        if (!gate.contentscript) {
            gate.contentscript = true;
            observer = new MutationObserver(contentScriptMessages);
            return observer.observe(gate, {
                attributes: true,
                attributeFilter: ["data-" + key1, "data-" + key2]
            });
        }
        if (sets) {
            if (ebony.is_userscript) {
                ebony.GM_setValue(ebony.id, sets);
            } else {
                chrome.storage.local.set({ebonySettings: JSON.parse(sets)});
            }
            document.documentElement.removeAttribute("data-ebonysend");
        } else if (locs) {
            document.documentElement.dataset.setlocale = chrome.i18n.getMessage(locs);
        }
    }
    function filterChromeKeys(keys) {
        if (keys[ebony.id] && keys[ebony.id].new_value) {
            document.documentElement.dataset.ebonyreceive = JSON.stringify(
                (keys[ebony.id].new_value && keys[ebony.id].new_value[ebony.id]) || keys[ebony.id].new_value || {}
            );
        }
    }
    function main(event) {
        var holder;
        if (!event && ebony.is_userscript) {
            event = JSON.parse(ebony.GM_getValue(ebony.id, "{}"));
        }
        if (event) {
            event = JSON.stringify(event[ebony.id] || event);
            document.documentElement.dataset.user_settings = event;
            /*if (ebony.is_userscript) {
                holder = document.createElement("link");
                holder.rel = "stylesheet";
                holder.type = "text/css";
                holder.href = "https://particlecore.github.io/Ebony/stylesheets/YouTubeBlacklist.css";
                document.documentElement.appendChild(holder);
            } else if (window.chrome) {
                holder = document.createElement("style");
                holder.textContent = //
                    "#DNT:hover:after," +
                    "#player-console > div," +
                    "#P-content input[type='radio']:checked + label:before," +
                    "#P-content input[type='checkbox']:checked + label:before{" +
                    "    background-image: url(chrome-extension://" + window.chrome.runtime.id + "/images/sprite.png);" +
                    "}";
                document.documentElement.appendChild(holder);
            }*/
            holder = document.createElement("style");
            holder.textContent = //
                `.bytc-add-to-blacklist {
                   background-image: url(data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iYnl0Yy1hZGQtdG8tYmxhY2tsaXN0LWljb24iIHZlcnNpb249IjEuMSIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9IkxheWVyXzEiIHNoYXBlLXJlbmRlcmluZz0iYXV0byIgaW1hZ2UtcmVuZGVyaW5nPSJhdXRvIiBjb2xvci1yZW5kZXJpbmc9ImF1dG8iIHRleHQtcmVuZGVyaW5nPSJhdXRvIiBjb2xvci1pbnRlcnBvbGF0aW9uPSJhdXRvIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMTMuNSAxOTMuNSAxOTIuNCAxOTIuNCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIHN0eWxlPSJmaWxsOiNmZmYiIGQ9Ik0xOTAuNCwzODUuOWwtODAuNy04MC42bC04MC42LDgwLjZsLTE1LjYtMTUuNmw4MC43LTgwLjZsLTgwLjctODAuNmwxNS42LTE1LjZsODAuNiw4MC42bDgwLjctODAuNmwxNS41LDE1LjZsLTgwLjYsODAuNiBsODAuNiw4MC42TDE5MC40LDM4NS45eiIvPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+);
                   background-position: center;
                   background-repeat: no-repeat;
                   background-color: rgba(0,0,0,.8);
                   background-size: 12px;
                   color: #fff;
                   top: 0;
                   left: -50px;
                   width: 22px;
                   height: 22px;
                   position: absolute;
                }
                body > .bytc-add-to-blacklist {
                   top: -100px;
                   left: -100px;
                }
                .yt-pl-thumb:hover .bytc-add-to-blacklist,
                .thumb-wrapper:hover .bytc-add-to-blacklist,
                .yt-lockup-thumbnail:hover .bytc-add-to-blacklist {
                   left: 0;
                }
                .bytc-add-to-blacklist-icon {
                   width:14px;
                   height:14px;
                   padding:4px;
                }`;
            document.documentElement.appendChild(holder);
            holder = document.createElement("script");
            holder.textContent = "(" + inject + "(" + ebony.is_userscript + "))";
            document.documentElement.appendChild(holder);
            holder.remove();
            if (!ebony.is_userscript) {
                chrome.storage.onChanged.addListener(filterChromeKeys);
            }
        }
    }
    var ebony = {
        id: "ebonySettings",
        is_userscript: typeof GM_info === "object"
    };
    if (ebony.is_userscript) {
        ebony.GM_getValue = GM_getValue;
        ebony.GM_setValue = GM_setValue;
        main();
    } else {
        chrome.storage.local.get(ebony.id, main);
    }
    contentScriptMessages();
}());