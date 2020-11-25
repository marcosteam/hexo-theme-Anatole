// Generate search page
hexo.extend.generator.register('searchPage', function(locals){
    return {
        path: 'search/index.html',
        data: locals.posts,
        layout: 'search'
    };
});