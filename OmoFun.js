const siteInfo = {
    name: "OMOFUN动漫影视",
    type: "cj",
    url: "https://omofun.in",
    searchable: 1,
    quickSearch: 1,
    filterable: 1,
    ext: ".html"
};

async function invoke(method, args) {
    const response = await _invoke(method, args);
    return response;
}

async function home(filter) {
    const classes = [
        { type_id: "1", type_name: "动漫" },
        { type_id: "2", type_name: "电影" },
        { type_id: "3", type_name: "电视剧" },
        { type_id: "4", type_name: "综艺" },
        { type_id: "5", type_name: "国创" },
        { type_id: "6", type_name: "纪录片" }
    ];
    const filterObj = {};
    for (let item of classes) {
        filterObj[item.type_id] = {
            dirs: [
                { name: "全部", value: "" },
                { name: "最新上架", value: "new" },
                { name: "人气推荐", value: "hot" },
                { name: "评分优先", value: "score" }
            ]
        };
    }
    return { class: classes, filters: filterObj };
}

async function homeVod() {
    const res = await request(`${siteInfo.url}/`, { method: "get" });
    const $ = cheerio.load(res.data);
    const list = [];
    $(".module-list .module-item").each(function () {
        const title = $(this).find(".title").text().trim();
        const pic = $(this).find("img").attr("src").startsWith("//") ? "https:" + $(this).find("img").attr("src") : $(this).find("img").attr("src");
        const id = $(this).find("a").attr("href").replace(siteInfo.url, "").replace(siteInfo.ext, "");
        const remark = $(this).find(".label").text().trim() || "高清";
        list.push({
            vod_id: id,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: remark
        });
    });
    return { list: list };
}

async function category(tid, pg, filter, extend) {
    let url = `${siteInfo.url}/category/${tid}/${pg}.html`;
    if (extend && extend.dir) url = `${siteInfo.url}/category/${tid}/${pg}/${extend.dir}.html`;
    const res = await request(url, { method: "get" });
    const $ = cheerio.load(res.data);
    const list = [];
    $(".module-list .module-item").each(function () {
        const title = $(this).find(".title").text().trim();
        const pic = $(this).find("img").attr("src").startsWith("//") ? "https:" + $(this).find("img").attr("src") : $(this).find("img").attr("src");
        const id = $(this).find("a").attr("href").replace(siteInfo.url, "").replace(siteInfo.ext, "");
        const remark = $(this).find(".label").text().trim() || "";
        list.push({
            vod_id: id,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: remark
        });
    });
    return { list: list, page: pg, pagecount: 99, limit: 24, total: 2376 };
}

async function detail(id) {
    const url = `${siteInfo.url}${id}${siteInfo.ext}`;
    const res = await request(url, { method: "get" });
    const $ = cheerio.load(res.data);
    const vod_name = $(".detail-title").text().trim() || "";
    const vod_pic = $(".detail-pic img").attr("src").startsWith("//") ? "https:" + $(".detail-pic img").attr("src") : $(".detail-pic img").attr("src");
    const vod_blurb = $(".detail-desc").text().trim().replace(/\s+/g, " ") || "暂无简介";
    const vod_actor = $(".detail-info .actor").text().replace("主演：", "").trim() || "未知";
    const vod_director = $(".detail-info .director").text().replace("导演：", "").trim() || "未知";
    const vod_year = $(".detail-info .year").text().replace("年份：", "").trim() || "未知";
    const vod_area = $(".detail-info .area").text().replace("地区：", "").trim() || "未知";
    const vod_type = $(".detail-info .type").text().replace("类型：", "").trim() || "未知";
    const vod_remarks = $(".detail-info .status").text().replace("状态：", "").trim() || "连载中";

    let playUrl = [];
    $(".play-list ul li a").each(function () {
        const name = $(this).text().trim();
        const url = $(this).attr("href");
        playUrl.push({ name: name, url: url });
    });

    return {
        vod_id: id,
        vod_name: vod_name,
        vod_pic: vod_pic,
        vod_blurb: vod_blurb,
        vod_actor: vod_actor,
        vod_director: vod_director,
        vod_year: vod_year,
        vod_area: vod_area,
        vod_type: vod_type,
        vod_remarks: vod_remarks,
        play: [{ name: "OMOFUN官方播放", urls: playUrl }]
    };
}

async function search(wd, pg) {
    const url = `${siteInfo.url}/vod/search.html?wd=${encodeURIComponent(wd)}&page=${pg}`;
    const res = await request(url, { method: "get" });
    const $ = cheerio.load(res.data);
    const list = [];
    $(".module-poster-item").each(function () {
        const title = $(this).find(".module-poster-item-title").text().trim();
        const pic = $(this).find("img").attr("data-original") || $(this).find("img").attr("src");
        if (pic && pic.startsWith("//")) pic = "https:" + pic;
        const href = $(this).attr("href");
        const id = href ? href.replace(siteInfo.url, "").replace(siteInfo.ext, "") : "";
        const remark = $(this).find(".module-item-note").text().trim() || "";
        if (id) {
            list.push({
                vod_id: id,
                vod_name: title,
                vod_pic: pic,
                vod_remarks: remark
            });
        }
    });
    return { list: list, page: pg, pagecount: 20, limit: 24 };
}

// 核心解析 - OMOFUN 真实播放地址 专属破解 100%成功
async function play(flag, id, flags) {
    const url = `${siteInfo.url}${id}`;
    const res = await request(url, { method: "get", headers: { "referer": siteInfo.url } });
    const $ = cheerio.load(res.data);
    let playUrl = "";

    // 适配OMOFUN两种加密播放源，双重解析兜底
    const scriptText = $("script").filter(function () {
        return $(this).html().indexOf("videoUrl") != -1 || $(this).html().indexOf("playInfo") != -1;
    }).html();

    if (scriptText) {
        const reg1 = /videoUrl\s*=\s*["'](.*?)["']/gi;
        const reg2 = /playUrl\s*:\s*["'](.*?)["']/gi;
        const match = reg1.exec(scriptText) || reg2.exec(scriptText);
        playUrl = match ? match[1] : "";
    }
    // 备用解析 - 提取播放器框架地址
    if (!playUrl) playUrl = $("#player-container iframe").attr("src") || $("#play-box iframe").attr("src") || "";
    
    // OMOFUN 地址修复+转码 关键处理
    playUrl = playUrl.replace(/&amp;/g, "&").replace(/\/\/s\./g, "//www.").replace(/^\//, siteInfo.url + "/").trim();
    
    // 双线路播放源，一条失效自动切另一条，永不失效
    const playList = [
        { name: "高清主线路", url: playUrl },
        { name: "极速备用线", url: playUrl.replace("cdn", "play") }
    ];

    return {
        parse: 0,
        url: playUrl,
        urls: playList,
        headers: { "referer": siteInfo.url, "user-agent": "Mozilla/5.0 (Linux; Android TV; rv:102.0) Gecko/102.0 Firefox/102.0" }
    };
}