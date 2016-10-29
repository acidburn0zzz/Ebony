// ==UserScript==
// @version         0.0.7
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
            console.log(26, this.details);
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
            container = document.querySelectorAll(
                ".section-list > li," +
                //".feed-item-container," +
                "#contents ytd-item-section-renderer" // material
            );
            i = container.length;
            while (i--) {
                if (ignore.containers.indexOf(container[i]) < 0) {
                    temp = container[i].querySelector(video_nodes);
                    if (!temp) {
                        container[i].outerHTML = "";
                        break;
                    } else {
                        ignore.containers.push(container[i]);
                    }
                }
            }
            console.info("resize");
            window.dispatchEvent(new Event("resize"));
            console.log(67, ignore.containers.length);
        }
        function getVideos(added_nodes) {
            var i, temp, text, ucid, child, parent, videos, button, remove, details, up_next;
            remove = [];
            details = {};
            up_next = document.querySelector(
                ".autoplay-bar," +
                "ytd-compact-autoplay-renderer" // material
            );
            videos = document.querySelectorAll(video_nodes);
            i = videos.length;
            while (i--) {
                if (ignore.videos.indexOf(videos[i]) < 0) {
                    if (videos[i].data) { // material
                        temp = videos[i];
                    } else {
                        temp = videos[i].querySelector(
                            ".content-wrapper [data-ytid]," +
                            ".yt-lockup-content [data-ytid]"
                        );
                    }
                    // console.log(85, temp);
                    if (temp) {
                        if (temp.data) {
                            ucid = temp.data.longBylineText || temp.data.shortBylineText;
                            ucid = ucid.runs[0];
                            text = ucid.text;
                            if (!ucid.navigationEndpoint) {
                                ucid = "YouTube";
                                details[ucid] = ucid;
                                console.info("YouTube", videos[i]);
                            } else {
                                ucid = ucid.navigationEndpoint.browseEndpoint.browseId;
                                details[ucid] = text;
                            }
                        } else if (temp.dataset && temp.dataset.ytid) {
                            ucid = temp.dataset.ytid;
                            details[ucid] = temp.textContent;
                        }
                    } else if (!temp) {
                        // if no UCID  then channel is YouTube
                        temp = videos[i].querySelector(".attribution");
                        if (temp) {
                            ucid = "YouTube";
                            details[ucid] = ucid;
                        }
                    }
                    if (ucid) {
                        if (blocked_channels[ucid]) {
                            if (up_next && up_next.contains(videos[i])) {
                                if (up_next.tagName === "YTD-COMPACT-AUTOPLAY-RENDERER") {
                                    up_next.outerHTML = "";
                                } else {
                                    up_next.parentNode.outerHTML = "";
                                    up_next = document.querySelector(".watch-sidebar-separation-line");
                                    if (up_next) {
                                        up_next.outerHTML = "";
                                    }
                                }
                            } else {
                                remove.push(videos[i]);
                            }
                        } else {
                            temp = videos[i].querySelector(
                                ".yt-pl-thumb," +
                                ".thumb-wrapper," +
                                ".yt-lockup-thumbnail," +
                                "#thumbnail" // material
                            );
                            if (temp) {
                                temp.details = {
                                    ucid: ucid,
                                    brand: details[ucid]
                                };
                                temp.addEventListener("mouseover", positionBlacklistButton);
                                temp.addEventListener("mouseleave", positionBlacklistButton);
                            }
                            ignore.videos.push(videos[i]);
                        }
                    }
                }
            }
            i = remove.length;
            if (i) {
                while (i--) {
                    child = remove[i];
                    while (child) {
                        parent = child.parentNode;
                        if (parent.childElementCount > 1 || parent.id === "contents" || parent.id === "items") {
                            //console.log(blocked_channels[ucid]);
                            child.outerHTML = "";
                            break;
                        }
                        child = parent;
                    }
                }
                if (globals.hasContainers) {
                    ignore.containers = [];
                } else {
                    console.info("resize");
                    window.dispatchEvent(new Event("resize"));
                }
            }
            //console.log(153, details, ignore.videos.length);
        }
        function loadMore(mutation) {
            /*var observer, load_more_button;
            load_more_button = document.querySelector(
                "#watch-more-related," +      // related sidebar
                "#browse-items-primary," +    // subscriptions page
                "#feed-main-what_to_watch," + // home or trending page
                "#content"                    // material home || #continuations loading icon
            );*/
            var load_more_button = document.querySelector(
                "ytd-search:not([hidden]) #contents #contents.ytd-item-section-renderer," +  // search page
                "ytd-browse:not([hidden]) #primary > #contents.ytd-section-list-renderer," + // home/subscriptions page
                "ytd-watch:not([hidden]) #items.ytd-watch-next-secondary-results-renderer"   // watch page
            );
            if (load_more_button && (!loadMore.button || !loadMore.button.contains(load_more_button))) {
                loadMore.button = load_more_button;
                loadMore.observer = new MutationObserver(blacklist);
                loadMore.observer.observe(load_more_button, {childList: true});
            }
            console.log(200);
        }
        function blacklist(event, observer) {
            var i, temp;
            if (!/^\/($|feed\/(?!subscriptions)|watch|results|shared)/.test(window.location.pathname)) {
                return;
            }
            if (!ignore || !event || event.type === "spfdone" || event.type === "yt-navigate-finish") {
                ignore = {
                    videos: [],
                    containers: []
                };
                globals = {
                    hasContainers: /^\/($|feed\/)/.test(window.location.pathname)
                };
            }
            if (!blacklist_button) {
                blacklist_button = document.createElement("div");
                blacklist_button.title = "Add to blacklist";
                blacklist_button.className = "bytc-add-to-blacklist";
                blacklist_button.innerHTML = //
                    "<svg class='bytc-add-to-blacklist-icon' viewBox='0 0 24 24'>" +
                    "    <polygon points='24,2.1 21.9,0 12,9.9 2.1,0 0,2.1 9.9,12 0,21.9 2.1,24 12,14.1 21.9,24 24,21.9 14.1,12'/>" +
                    "</svg>";
                    /*"<svg class='bytc-add-to-blacklist-icon' viewBox='0 0 24 24'>" +
                    "    <polygon points='24,1.4 22.6,0 12,10.6 1.4,0 0,1.4 10.6,12 0,22.6 1.4,24 12,13.4 22.6,24 24,22.6 13.4,12'/>" +
                    "</svg>";*/
                    /*"<svg class='bytc-add-to-blacklist-icon' viewBox='0 0 24 24'>" +
                    "    <polygon points='24,2.8 21.2,0 12,9.2 2.8,0 0,2.8 9.2,12 0,21.2 2.8,24 12,14.8 21.2,24 24,21.2 14.8,12'/>" +
                    "</svg>";*/
                blacklist_button.addEventListener("click", addToBlacklist, true);
                document.body.appendChild(blacklist_button);
            }
            if (observer) {
                i = event.length;
                while (i--) {
                    if (event[i].addedNodes.length) {
                        temp = document.querySelectorAll(
                            "ytd-search:not([hidden]) #contents #contents.ytd-item-section-renderer > *," +  // search page
                            "ytd-browse:not([hidden]) #primary > #contents.ytd-section-list-renderer > *," + // home/subscriptions page
                            "ytd-watch:not([hidden]) #items.ytd-watch-next-secondary-results-renderer > *"   // watch page
                        ).length;
                        console.log("count: " + temp);
                        getVideos();
                        break;
                    }
                }
            } else {
                console.log(245);
                getVideos();
                if (event && !observer) {
                    if (loadMore.observer) {
                        loadMore.button = false;
                        loadMore.observer.disconnect();
                    }
                    loadMore();
                }
            }
            if (globals.hasContainers) {
                cleanEmptyContainers();
            }
        }


        var ignore, globals, video_nodes, blocked_channels, blacklist_button;

        video_nodes = //
            // main, trending, subscription, search
            ".yt-lockup-video," +
            ".yt-lockup-channel," +
            ".yt-lockup-playlist," +
            // related
            ".related-list-item," +
            // material
            "ytd-grid-video-renderer," +
            "ytd-compact-video-renderer," +    // watch sidebar videos
            "ytd-compact-playlist-renderer," +
            "ytd-compact-radio-renderer," +
            "ytd-show-renderer," +             // search show card
            "ytd-radio-renderer," +            // search radio card
            "ytd-video-renderer," +            // single video in home feed or search page
            "ytd-channel-renderer," +          // search channel card
            "ytd-playlist-renderer";           // search playlist
        blocked_channels = {};
        window.b = blocked_channels;

        document.addEventListener("readystatechange", blacklist);
        document.addEventListener("spfdone", blacklist);
        document.addEventListener("yt-navigate-finish", blacklist); // material
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
            }*/
            holder = document.createElement("style");
            holder.textContent = //
                `.bytc-add-to-blacklist {
                    background-color: #000;
                    color: #fff;
                    top: 0;
                    left: 0;
                    height: 0;
                    width: 0;
                    cursor: pointer;
                    padding: 14px;
                    opacity: 0;
                    border-radius: 2px;
                    margin: 4px;
                    position: absolute;
                    transition: opacity 0.3s;
                    z-index: 1;
                }
                body > .bytc-add-to-blacklist {
                    top: -100px;
                    left: -100px;
                }
                a:hover > .bytc-add-to-blacklist,
                div:hover > .bytc-add-to-blacklist {
                    opacity: .8;
                }
                .bytc-add-to-blacklist-icon {
                    fill:#fff;
                    width:16px;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                }
                .blocked {
                    display: none !important;
                }
                ytd-channel-renderer #thumbnail { /* fix blacklist not posotioned inside thumb */
                    position: relative;
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
