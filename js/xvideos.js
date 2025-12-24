var rule = {
    title:'Xvideos',
    host:'https://www.xvideos.com',
    searchUrl:'/search/**',
    url:'/fyclass?page=fypage',
    headers:{
        'User-Agent':'MOBILE_UA'
    },
    timeout:5000,
    class_name:'最新&最热&最多观看&最高评分',
    class_url:'new&best&viewed&rating',
    limit:5,
    play_parse:true,
    lazy:'',
    一级:'.mozaique .thumb-block;img&&alt;img&&data-src;.metadata&&Text;a&&href',
    二级:'*',
    搜索:'.mozaique .thumb-block;img&&alt;img&&data-src;.metadata&&Text;a&&href',
    searchable:1,
    quickSearch:1,
    filterable:0,
}
