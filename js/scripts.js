var data;
var id = 0;
var PI = Math.PI;
var selectState = {start:false,mouseDown:false, dragging:false, x:0,y:0};
var scrolling = false;
var copying = false;
var startPosition = {};
var saved = {
    undo: [],
    redo: []
};
var cursorPosition = {x: 0, y: 0};
$.getJSON({url: 'data.json',async: false,success: function(json) {data = json;}});

$(function() {
    addMenuItems();
    printRulerNumbers();
    styling();
    handleButtonsEnabling();
    $(window).resize(function() {styling()}).scroll(function(){styling()});
    $('.field, .form').attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);
    if (history != undefined && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
    $('#calculator').scroll(function() {stylingOneTitle();});
    $('#calculator').scrollTop(9999);
    if (window.location.href.indexOf('save=') != -1) loadField();
    
    $('.panel .form .close').click(function() {$(this).parents('.form').hide()});
    $('.button').click(function(event) {
        if ($(this).hasClass('disabled')) {
            event.stopImmediatePropagation();
            return false;
        }
        $('.panel .form').hide();
    });
    $('.panel .button.undo').click(function() {
        var conf = saved.undo[saved.undo.length - 1];
        saved.redo.push(getLink());
        loadField(conf);
        $('.button.redo').removeClass('disabled');
        saved.undo.splice(-1, 1);
        if (saved.undo.length == 0) $(this).addClass('disabled');
    });
    $('.panel .button.redo').click(function() {
        var conf = saved.redo[saved.redo.length - 1];
        saved.undo.push(getLink());
        loadField(conf);
        $('.button.undo').removeClass('disabled');
        saved.redo.splice(-1, 1);
        if (saved.redo.length == 0) $(this).addClass('disabled');
    });
    $('.panel .button.elements').click(function() {$('.panel .form.elements').show()});
    $('.panel .button.colors').click(function() {$('.panel .form.colors').show();});
    $('.panel .button.bg').click(function() {$('.panel .form.bg').show();});
    $('.panel .button.delete').click(function() {
        if ($('.field .selected').length > 0) {
            saveUndoState();
            var divs = $('.field .selected');
            for (var i = 0; i < divs.length; i++) {
                var div = $('.field .selected').eq(i);
                var id = div.data().id;
                var conns = div.data().connections;
                if (conns.left !== undefined) {
                    var leftDiv = $('.field .element[data-id='+conns.left+']');
                    leftDiv.removeClass('noRotation');
                    var leftConn = leftDiv.data('connections');
                    leftConn.right = undefined;
                    leftDiv.data('connections', leftConn);
                }
                if (conns.right !== undefined) {
                    var rightDiv = $('.field .element[data-id='+conns.right+']');
                    var rightConn = rightDiv.data('connections');
                    rightConn.left = undefined;
                    rightDiv.data('connections', rightConn);
                }
                var connectors = $('.field .connector:not(.etalon)[data-left='+id+'], ' +
                                   '.field .connector:not(.etalon)[data-right='+id+']');
                connectors.remove();
            }
            divs.remove();
            
            handleButtonsEnabling();
            countBill();
        }
        else openDialog('delete');
    });
    $('.panel .button.print').click(function(){
        $.ajax('css/print.css').done(function(data) {
            var iframe = document.createElement('iframe');
            iframe.style = "width:1px; height:1px; left:-9999px; position:absolute;display:none";
            document.body.append(iframe);
            var style = document.createElement('style');
            style.innerHTML = data;
            iframe.contentDocument.getElementsByTagName('head')[0].appendChild(style);
            var content = $('<div><div class="field"/><div class="table"/></div>');
            var elements = $('.field .element:not(.etalon)');
            var win = {
                x: {min: $('#calculator').scrollLeft(), max: $('#calculator').scrollLeft() + $('#calculator').width()},
                y: {min: $('#calculator').scrollTop(),  max: $('#calculator').scrollTop()  + $('#calculator').height()}
            };
            var inWindowElements = [];
            for (var i = 0; i < elements.length; i++) {
                var element = elements.eq(i);
                var points = element.data().points;
                var inWindow = true;
                for (var j in points) {
                    var inWindowPoint = (
                            points[j].x.between(win.x.min, win.x.max) && 
                            points[j].y.between(win.y.min, win.y.max)
                    );
                    if (!inWindowPoint) inWindow = false;
                }
                if (inWindow) inWindowElements.push({
                    id: element.data().id,
                    points: points
                });
            }
            var field = {
                x: {min: Infinity, max: 0}, 
                y: {min: Infinity, max: 0}
            };
            for (i in inWindowElements) {
                var points = inWindowElements[i].points;
                for (j in points) {
                    if (points[j].x < field.x.min) field.x.min = points[j].x;
                    if (points[j].y < field.y.min) field.y.min = points[j].y;
                    if (points[j].x > field.x.max) field.x.max = points[j].x;
                    if (points[j].y > field.y.max) field.y.max = points[j].y;
                }
            }
            for (i in inWindowElements) {
                var div = $('.field .element[data-id=' + inWindowElements[i].id + ']').clone();
                div.css({
                    left: parseFloat(div.css('left')) - field.x.min + 6,
                    top:  parseFloat(div.css('top'))  - field.y.min + 6
                });
                div.appendTo(content.find('.field'));
            }
            var fWidth = field.x.max - field.x.min;
            var A4Width = 1050;
            if (fWidth > A4Width) {
                var scale = Math.round(A4Width / fWidth * 100) / 100;
                var translate = - Math.round((1 - scale) * fWidth);
                content.find('.field').css({
                    transform: 'scale(' + scale + ') translate(' + translate + 'px)'
                });
            }
            content.find('.rotator').remove();
            content.find('.selected').removeClass('selected');
            countBill(true);
            $('.dialog.order table').clone().appendTo(content.find('.table'));
            iframe.contentDocument.body.innerHTML = content.html() + "<script>window.print()</script>";
            iframe.contentWindow.print();
            //iframe.remove();
        });
    });  
    $('.panel .button.save').click(function(){ 
        var link = getLink();
        var url = window.location.href;
        if (url.indexOf('save=') == -1) {
            var s = (url.indexOf('?') == -1) ? '?' : '&';
            link = url + s +'save=' + link;
        }
        else link = url.replace(/save=[^&]+/.exec(url)[0], 'save=' + link);
        $('.dialog.save .link').text(link);
        history.pushState('', '', link);
        $('.dialog.save .error').hide();
        openDialog('save');
    });
    $('.panel .button.copy').click(function(){
        if (copying) handleCopyingState(false);
        else handleCopyingState(true);
    });
    $('.panel .form.colors .color:not(.etalon)').click(function() {selectColor(this);});
    $('.panel .form.colors .color:not(.etalon)').eq(6).click();
    $('.panel .form.bg .color').click(function() {
        var arg = $(this).attr('class').split(' ')[1];
        if (arg == 'bg') {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $('.field>.bg').attr('class', 'bg');
            }
            else {
                $(this).addClass('selected');
                var bg = $(this).attr('class').split(' ')[2];
                $('.field>.bg').attr('class', 'bg ' + bg);
            }
        }
        else {
            $(this).parents('.list').find('.selected').removeClass('selected');
            $(this).addClass('selected');
            $('.field>.web').attr('class', 'web ' + arg);
        }
    });
    $('.panel .form.bg .color.gray').click();
    $('.panel .element').draggable({
        containment: $('.field'),
        helper: function() {
            var helper = $(this).clone();
            setSelectedElement(null, helper);
            return helper.appendTo('.field');
        },
        scroll: false,
        start: function(event, ui) {
            ui.helper.data({id:id++, angle: 0, connections:{left:undefined, right: undefined}});
            ui.helper.height(ui.helper.find('img').height());
            countBill();
        },
        drag: function(event, ui) {
            ui.helper.data({top: ui.position.top, left: ui.position.left});
            countCoords(ui.helper, true);
            joinToConnection(ui.helper, ui);
        }
    });
    
    $('.field').droppable({
        drop: function(event, ui) {
            var obj = ui.helper;
            if (obj.hasClass('element') == false) return;
            saveUndoState();
            if (obj.hasClass('notNew') == false && obj.attr('id') != 'groupselect') {
                setSelectedElement(event, obj);
                var elem = obj.clone().removeClass('ui-draggable-dragging').addClass('notNew')
                    .data({top: ui.position.top, left: ui.position.left, angle: 0, 
                            id: obj.data().id, connections: obj.data().connections})
                    .attr('data-id', obj.data().id)
                    .appendTo($(this))
                    .css({top: ui.position.top, left: ui.position.left});
                elem.draggable(draggableObject(elem));
                countCoords(elem);
                elem.height(elem.find('img').height());
                elem.rotatable(rotatableObject(elem))
                    .click(function(event) {setSelectedElement(event, this);})
                elem.height(elem.find('img').height());
            }
        }
    });
    $('.field').mousedown(function(event) {
        if (event.button == 1) {
            event.preventDefault();
            $('.field').addClass('scrolling');
            scrolling = true;
            __startX = event.screenX;
            __startY = event.screenY;
            return false
        }
        else if (event.button == 0) {
            selectState.x = event.pageX - $('.field').offset().left;
            selectState.y = event.pageY - $('.field').offset().top;
            selectState.mouseDown = true;
            $('#point1').css({top:selectState.y-5, left:selectState.x-5});
        }
    });
    $('.field').mousemove(function(event) {
        cursorPosition = {x: event.pageX, y: event.pageY};
        if (scrolling) {
            var dx = __startX - event.screenX;
            var dy = __startY - event.screenY;
            $('#calculator').scrollLeft($('#calculator').scrollLeft() + dx);
            $('#calculator').scrollTop($('#calculator').scrollTop() + dy);
            __startX = event.screenX;
            __startY = event.screenY;
        }
        if (selectState.dragging) return;
        if (!selectState.mouseDown) return;
        var x = event.pageX - $('.field').offset().left;
        var y = event.pageY - $('.field').offset().top;
        if (selectState.start) {
            var s = [{x: selectState.x, y: selectState.y}, {x: x, y: y}];
            var width  = x - selectState.x;
            var height = y - selectState.y;
            $('.selectRectangle').css({
                width:  Math.abs(width),
                height: Math.abs(height),
                left: (width < 0)  ? (selectState.x + width)  : selectState.x,
                top:  (height < 0) ? (selectState.y + height) : selectState.y
            });
            
            var divs = $('.field .element');
            for (var i = 0; i < divs.length; i++) {
                var div = divs.eq(i);
                var p = div.data().points;
                if (CohenSutherland(s,p, div.data().angle)) div.addClass('selected');
                else div.removeClass('selected');
            }
            handleButtonsEnabling();
        }
        else if (Math.abs(selectState.x - x + selectState.y - y) > 10){
            selectState.start = true;
            setSelectedElement();
            $('.selectRectangle').css({display: 'block', width:0, height:0});
        }
    });
    $('.field').mouseup(function(event) {
        if (event.button = 1) {
            $('.field').removeClass('scrolling');
            scrolling = false;
        }
        selectState.mouseDown = false;
    });
    $('.field').click(function(event){
        if (copying) {
            saveUndoState();
            var selecteds = $('.field .selected');
            if (event.pageX == undefined && event.pageY == undefined) {
                event.pageX = cursorPosition.x;
                event.pageY = cursorPosition.y;
            }
            var x = event.pageX - $('.field').offset().left;
            var y = event.pageY - $('.field').offset().top;
            var xDif = 0;
            var yDif = 0;
            var prev;
            var transitions = {};
            var newOnes = {};
            for (var i = 0; i < selecteds.length; i++) {
                var selected = selecteds.eq(i);
                var h = selected.height();
                var w = selected.width();
                var data = selected.data();
                if (prev == undefined) {
                    xDif = x;
                    yDif = y;
                    var prev = selected;
                }
                else {
                    xDif = x + data.left - prev.data().left;
                    yDif = y + data.top - prev.data().top;
                }
                var newOne = selected.clone()
                        .css({top: yDif, left: xDif})
                        .data({connections: {left: undefined, right: undefined}, 
                               id: id++, left: xDif, top: yDif, angle: data.angle})
                        .attr('data-id', id - 1)
                        .appendTo('.field');
                transitions[data.id] = id - 1;
                countCoords(newOne);
                newOne.draggable(draggableObject(newOne))
                      .rotatable(rotatableObject(newOne, data.angle))
                      .click(function(event) {setSelectedElement(event, this);});
                newOnes[id - 1] = newOne;
            }
            for (var i = 0; i < selecteds.length; i++) {
                var data = selecteds.eq(i).data();
                var newOne = newOnes[transitions[data.id]];
                var connections = newOne.data().connections;
                for (var dir in data.connections) {
                    if (data.connections[dir] == undefined) continue;
                    connections[dir] = transitions[data.connections[dir]];
                }
                if (connections['left'] != undefined)
                        drawConnector(
                            connections[dir], transitions[data.id],
                            newOne.data().left, newOne.data().top
                        );
                if (connections['right'] == undefined) newOne.removeClass('noRotation');
                newOne.data({connections: connections});
            }
            countBill();
        }
        handleCopyingState();
        if (selectState.start) {
            $('.selectRectangle').css({display:'none'});
            selectState.start = false;
        }
        else setSelectedElement();
    });
    $('.field .order').click(function(){
        countBill(true);
        openDialog('order');
    });
    $('.field .button.help').click(function() {openDialog('help')});
    
    $('.dialogs .dialog .button.cancel').click(function(){closeDialog();});
    $('.dialogs .dialog.delete .button.ok').click(function() {
        saveUndoState();
        $('.field .element, .field .connector:not(.etalon)').remove();
        handleButtonsEnabling();
        countBill();
        closeDialog();
    });
    $('.dialogs .dialog.save .button.ok').click(function() {
        var email = $('.dialog.save [name=email]').val();
        var link = $('.dialog.save .link').text();
        if (/[-_\w\d]+@[-._\w\d]+/.test(email)) {
            $.post('ajax.php',{action: 'sendlink', email:email, link: link});
            closeDialog();
        }
        else {
            $('.dialog.save .error').show();
            return false;
        }
    });
    $('.dialogs .dialog.order .button.ok').click(function() {
        closeDialog();
        $('.dialogs .dialog.sendOrder .wrongEmail').hide();
        $('.dialogs .dialog.sendOrder .wrongPhone').hide();
        openDialog('sendOrder');
    });
    $('.dialogs .dialog.sendOrder .button.ok').click(function() {
        $('.dialogs .dialog.sendOrder .wrongEmail').hide();
        $('.dialogs .dialog.sendOrder .wrongPhone').hide();
        var email = $('.dialogs .dialog.sendOrder [name=email]').val();
        var phone = $('.dialogs .dialog.sendOrder [name=phone]').val();
        var comment = $('.dialogs .dialog.sendOrder [name=comment]').val();
        var link = getLink();
        if (/^[-_\w\d]+@[-._\w\d]+$/.test(email) == false) {
            $('.dialogs .dialog.sendOrder .wrongEmail').show();
            return;
        }
        if (/^[-+\s\d()]+$/.test(phone) == false) {
            $('.dialogs .dialog.sendOrder .wrongPhone').show();
            return;
        }
        $.post('ajax.php',{action: 'order', email:email, phone: phone, link: link, comment: comment}, function(data) {
            console.log(data);
        });
        closeDialog();
        openDialog('thanks');
    });
    $('.dialogs .dialog.thanks .button.ok').click(function() {closeDialog();});
    $('.dialog.help .close').click(function() {closeDialog();});
    $('.dialog.help .paginator').find('.arrow, .pages span').click(function() {
        if ($(this).hasClass('disabled')) return;
        var page;
        if ($(this).hasClass('arrow')) {
            page = $('.dialog.help .pageView .page.active').attr('class').split(' ')[1].split('_')[1];
            page = parseInt(page);
            if ($(this).hasClass('left')) page--;
            else page++;
        }
        else page = $(this).attr('class').split('_')[1];
        $('.dialog.help .pageView .page.active').removeClass('active');
        $('.dialog.help .paginator .arrow.disabled').removeClass('disabled');
        $('.dialog.help .paginator .pages span.disabled').removeClass('disabled');
        $('.dialog.help .pageView .page.page_'+page).addClass('active');
        if (page == 1) $('.dialog.help .paginator .arrow.left').addClass('disabled');
        if (page == 3) $('.dialog.help .paginator .arrow.right').addClass('disabled');
        $('.dialog.help .paginator .pages span.page_'+page).addClass('disabled');
    });
    $('.panel .form.bg .palette .hueContainer .pointer').draggable({
        containment: "parent",
        axis: 'y',
        create: function() {
            $('.panel .form.bg .palette .gradient.main').css({'background-color': 'hsl(0, 100%, 50%)'});
            $('.field .bg').data({H: 0});
        },
        drag: function(event, ui) {
            var H = Math.round(ui.position.top / $(this).parent().height() * 359);
            $('.panel .form.bg .palette .gradient.main').css({'background-color': 'hsl(' + H + ', 100%, 50%)'});
            $('.field .bg').data({H: H});
            coloriseBG();
        }
        
    });
    $('.panel .form.bg .palette .square .pointer').draggable({
        containment: "parent",
        create: function(event, ui) {
            $(this).css({left: 0, top: 0});
            $('.field .bg').data({S: 0, L: 100});
            coloriseBG();
        },
        drag: function(event, ui) {
            var parent = $('.panel .form.bg .palette .square');
            var hlf = $(this).outerWidth(true) / 2;
            hlf = 0;
            /*if (ui.position.left < -hlf) ui.position.left = -hlf;
            if (ui.position.left > parent.width() - hlf) ui.position.left = parent.width() - hlf;
            if (ui.position.top < -hlf) ui.position.top = -hlf;
            if (ui.position.top > parent.height() - hlf) ui.position.top = parent.height() - hlf;*/
            var left = Math.round(ui.position.left / parent.width() * 100);
            var top  = Math.round(ui.position.top  / parent.height() * 100);
            var S = left;
            var Lmax = 100 - S / 2;
            var L = Math.round((100 - top) / 100 * Lmax);
            $('.field .bg').data({S: S, L: L});
            coloriseBG();
        }
    });
    
    var ctrlDown = false;
    $(document).keydown(function(e) {
        if (e.keyCode == 17 || e.keyCode == 91) ctrlDown = true; //ctrl и cmd-key(Mac) 
    }).keyup(function(e) {
        if (e.keyCode == 17 || e.keyCode == 91) ctrlDown = false;
        if (ctrlDown && e.keyCode == 86) $('.field').click(); //Ctrl+V
        if (ctrlDown && e.keyCode == 67) $('#calculator .panel .button.copy').click(); //Ctrl+C
        if (e.keyCode = 46 && e.key == 'Delete') $('#calculator .panel .button.delete').click(); //delete
    });
});