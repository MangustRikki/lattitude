function styling() {
    $('#calculator').height($(window).outerHeight(true) - $('.header').outerHeight((true)));
    var h = ($('.header').outerHeight((true)) + $(window).height() - $('.panel').outerHeight(true)) / 2;
    if (h > 10) $('.panel').css('top', h);
    else $('.panel').css('top', 10);
    if (h - $('.header').outerHeight((true)) < 80) $('.field .priceorder').css('left', 87);
    else $('.field .priceorder').css('left', 10);
    $('.help').css('top', $('#calculator').offset().top + 10);
    $('.helpframe').css('top', $('#calculator').offset().top);
    $('.panel>.top').css('top', -($('#calculator').height() - $('.panel').height()) / 2);
    if ($('#calculator').height() < 780) $('.panel>.top').css('left', 80);
    var titles = $('.helpframe .title');
    var header = $('.header').outerHeight(true);
    for (var i = 0; i < titles.length; i++) {
        var title = titles.eq(i);
        var target, css;
        var cl = title.attr('class').split(' ')[1];
        if (cl == 'background') cl = 'bg';
        if (cl == 'f') cl = 'field';
        switch (cl) {
            case 'price':
                var po = $('.priceorder').position();
                css = {
                    left: parseInt(po.left) + 275,
                    top: parseInt(po.top) - header - 84
                };
                break;
            case 'number':
                stylingOneTitle();
                continue;
            case 'field':
                css = {
                    left: ($('#calculator').width()  - title.outerWidth(true)) / 2,
                    top:  ($('#calculator').height() - title.outerHeight(true)) / 2
                };
                break
            default:
                var panel = $('.panel').css(['left', 'top']);
                target = $('.panel .button.' + cl).position();
                css = {
                    left: parseInt(target.left) + parseInt(panel.left) + 84,
                    top:  parseInt(target.top) + parseInt(panel.top) - header - 84
                };
                break;
        }
        if (css != undefined) {
            title.css(css);
        }
        else {
            title.hide();
        }
    }
}
function stylingOneTitle() {
    var numbers = $('.web .number.big');
    var first = true, css;
    for (var j = 0; j < numbers.length; j++) {
        var number = numbers.eq(j);
        if (number.text() == "200") {
            if (first) first = false;
            else break;
        }
    }
    var src = {
        left: $('#calculator').scrollLeft(),
        top: $('#calculator').scrollTop()
    };
    var win = {
        width: $('#calculator').width(),
        height: $('#calculator').height()
    };
    var num = {
        left: parseFloat(number.css('left')),
        top: parseFloat(number.css('top'))
    };
    if (num.left > src.left && num.left < src.left + win.width && 
        num.top  > src.top  && num.top  < src.top  + win.height) {
        css = {
            left: num.left - src.left + 50,
            top: num.top - src.top - 75,
            bottom: ""
        };
    }
    else {
        var css = {
            left: win.width / 2,
            top: "",
            bottom: 80
        };
    }
    $('.helpframe .title.number').css(css);
}
function selectColor(obj) {
    var color = $(obj).attr('data-color');
    var colorDiv = $('.panel .form.colors .color[data-color='+color+']');
    $('.color.selected').removeClass('selected');
    colorDiv.addClass('selected');
    var divs = $('.panel .form.elements .element:not(.etalon)');
    for (var i = 0; i < divs.length; i++) colorizeElement(divs.eq(i), color);
    if ($(obj).parents('.field').length == 0) {
        var elements = $('.field .element.selected');
        if (elements.length > 0) saveUndoState();
        for (var i = 0; i < elements.length; i++) colorizeElement(elements.eq(i), color);
    }
    countBill();
}
function colorizeElement(obj, color) {
    obj = $(obj);
    obj.attr('data-color',color)
       .data('color',color);
    if (color != 'tree') {
           obj.find('.colorisator').css('border-color', '#' + color);
    }
    else {
           obj.find('.colorisator').css('border-color', '#f4b873');
    }
    //.css({'border-color': color == 'tree' ? color : ('#' + color)});
}
function setSelectedElement(event, obj) {
    //устанавливает выделенный элемент
    $('.field .element').removeClass('selected');
    if (obj) {
        $(obj).addClass('selected');
        if ($(obj).hasClass('notNew')) selectColor(obj);
    }
    if (event) event.stopPropagation();
    handleButtonsEnabling();
}
function handleButtonsEnabling() {
    if ($('.field .selected').length > 0) $('.button.copy').removeClass('disabled');
    else $('.button.copy').addClass('disabled');
    
    if ($('.field .element').length > 0) {
        $('.button.print').removeClass('disabled');
        $('.button.delete').removeClass('disabled');
        $('.button.save').removeClass('disabled');
    }
    else {
        $('.button.print').addClass('disabled');
        $('.button.delete').addClass('disabled');
        $('.button.save').addClass('disabled');
    }
    if (saved.undo.length == 0) $('.button.undo').addClass('disabled');
    else $('.button.undo').removeClass('disabled');
    if (saved.redo.length == 0) $('.button.redo').addClass('disabled');
    else $('.button.redo').removeClass('disabled');
}
function countBill(mkTable) {
    if (mkTable == undefined) mkTable = false;
    var bill = {};
    bill['caps'] = {};
    var elements = $('.field .element');
    var prices = data.prices;
    var total = 0;
    var connectorsForCaps = 0;
    for (var i = 0; i < elements.length; i++) {
        var element = elements.eq(i);
        var name = element.attr('data-name');
        var color = element.attr('data-color');
        for (var j in data.colors) if (data.colors[j][0] == '#'+color) break;
        var colorName = data.colors[j][1];
        if (typeof prices[name] == 'object') var price = prices[name][parseInt(j)+1];
        else var price = prices[name];
        if (bill[name] == undefined) bill[name] = {};
        if (bill[name][color] == undefined) bill[name][color] = {num: 0 , price: price, summ: 0};
        bill[name][color].num++;
        bill[name][color].summ = bill[name][color].num * bill[name][color].price;
        total += price;
        if (bill.caps[color] == undefined) bill.caps[color] = {num: 0, price: prices.cap, summ: 0};
        var connections = element.data().connections;
        if (connections.left  == undefined) {
            bill.caps[color].num += 2;
            connectorsForCaps++;
        }
        if (connections.right == undefined) {
            bill.caps[color].num += 2;
            connectorsForCaps++;
        }
        bill.caps[color].summ = bill.caps[color].num * prices.cap;
    }
    /*
    var caps = (elements.length - $('.field .connector:not(.etalon)').length) * 2;
    total += caps * prices.cap;
    bill['caps'] = {num: caps, price: prices.cap, summ: caps * prices.cap};
    */
    for (var color in bill.caps) {
        var cap = bill.caps[color];
        bill.caps[color].summ = cap.num * cap.price;
        total += bill.caps[color].summ;
    }
    //var connections = $('.field .connector:not(.etalon)').length;
    var connections = $('.field .connector:not(.etalon)').length + connectorsForCaps;
    total += connections * prices.connection;
    bill['connections'] = {num: connections, price: prices.connection, summ: connections * prices.connection};
    $('.field .price span').text(total.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1.'));
    if (total == 0) $('.field .order').button({disabled: true});
    else $('.field .order').button({disabled: false});
    
    if (!mkTable) return;
    $('.dialog.order table tbody tr:not(.etalon):not(.total)').remove();
    var etalon = $('.dialog.order table .etalon');
    for (var name in bill ) {
        if (name == 'caps' || name == 'connections') continue;
        for (var color in bill[name]) {
            var tr = etalon.clone().removeClass('etalon');
            var colorName = getColorName(color);
            with (tr.find('td')) {
                eq(0).text('Полка ' + name + 'см');
                if (colorName == undefined) 
                    eq(1).addClass('noPadding').html('Текстура дерева');
                else 
                    eq(1).html('<div class="color" style="background-color:#'+color+'"></div> '+ colorName);
                eq(2).text(bill[name][color].price + '₽');
                eq(3).text(bill[name][color].num);
                eq(4).text(bill[name][color].summ + '₽');
            }
            tr.insertBefore('.dialog.order table tbody .total');
        }
    };
    for (var color in bill.caps) {
        var cap = bill.caps[color];
        if (cap.num == 0) continue;
        var tr = etalon.clone().removeClass('etalon');
        var colorName = getColorName(color);
        with (tr.find('td')) {
            eq(0).text('Концевые загрушки');
            if (colorName == undefined) 
                eq(1).addClass('noPadding').html('Текстура дерева');
            else 
                eq(1).html('<div class="color" style="background-color:#'+color+'"></div> '+ colorName);
            eq(2).text(cap.price + '₽');
            eq(3).text(cap.num);
            eq(4).text(cap.summ + '₽');
        }
        tr.insertBefore('.dialog.order table tbody .total');
    }
    if (bill.connections.num > 0) {
        var tr = etalon.clone().removeClass('etalon');
        with (tr.find('td')) {
            eq(0).text('Крепеж');
            eq(1).text('');
            eq(2).text(bill.connections.price + '₽');
            eq(3).text(bill.connections.num);
            eq(4).text(bill.connections.summ + '₽');
        }
        tr.insertBefore('.dialog.order table tbody .total');
    }
    $('.dialog.order .total .number').text(total + '₽');
}
function getColorName(color) {
    for (var type in data.colors) 
        for (var j in data.colors[type]) 
            if (data.colors[type][j][0] == '#'+color)
                return data.colors[type][j][1];
}
function angleMore90(alfa, beta) {
    var angle = Math.abs(PI - Math.abs(alfa - beta));
    if (angle > PI) angle = PI - angle;
    if (angle < PI/2) return false;
    else return true;
}
function CohenSutherland(s, p, angle) {
    //функция определения наличия отрезка с точками p и углом angle в выделяющем прямоугольнике с координатами s
    //Реализует алгоритм Коэна-Сазерленда (см. Википедию) с некоторыми изменениями. Добавлено особое поведение в
    //ситуации, когда точки отрезка находятся выше и ниже, но не левее-правее: такая ситуация говорит, что отрезок
    //имеет угол, близкий к прямому, или равный ему, а тангенс такого угла равен большим числам, что не позволяет
    //корректно расчитать 2ую координату возможной точки пересечения. Функция в этом случае вернет true, т.к. отсутствие
    //пересечения в данной ситуации геометрически невозможно. Плюс еще несколько оптимизаций.
    //Оригинальный алгоритм предлагал искать кратчайшее пересечение прямой отрезка с прямыми сторон прямоугольника,
    //после чего рекурентно запускать алгоритм на новом отрезке, 
    //но тут просто перебираются все 4 возможные точки пересечения и, если хотя бы одна из этих точек входит
    //в прямоугольник, то перебор прекращается и возвращается true. Такое решение мне показалось значительно упрощающим
    //разработку и в достаточной степени нетребовательным к ресурсам.
    var bits = [0,0];
    for (var i in p) {
        if      (p[i].x > Math.max(s[0].x, s[1].x)) bits[i] += 2;
        else if (p[i].x < Math.min(s[0].x, s[1].x)) bits[i] += 1;
        
        if      (p[i].y > Math.max(s[0].y, s[1].y)) bits[i] += 4;
        else if (p[i].y < Math.min(s[0].y, s[1].y)) bits[i] += 8;
    }
    
    if      (bits[0] == 0 || bits[1] == 0) return true; //отрезок внутри выделения
    else if ((bits[0] & bits[1]) > 0) return false; //нет пересечения
    else if (bits[0] + bits[1] == 12) return true; //вертикальный отрезок, близкий к 90град угол.
    else if (bits[0] + bits[1] == 3) return true; //горизонтальный отрезок. Очевидно, что да
    else if (bits[0] + bits[1] == 15) return true; //через крайние углы, очевидно что да
    else {
        for (i = 0; i <= 3; i++) {
            var point = {x: 0, y: 0};
            if (i & 1) {
                if (i & 2) point.x = Math.max(s[0].x, s[1].x);
                else point.x = Math.min(s[0].x, s[1].x);
                point.y = p[0].y + (point.x - p[0].x) * Math.tan(angle);
            }
            else {
                if (i & 2) point.y = Math.max(s[0].y, s[1].y);
                else point.y = Math.min(s[0].y, s[1].y);
                point.x = p[0].x + (point.y - p[0].y) * Math.tan(angle);
            }
            if (point.x.between(s[0].x, s[1].x) && point.y.between(s[0].y, s[1].y)) return true;
        }
        return false;
    }
}
function handleCopyingState(state) {
    if (state == undefined) state = false;
    if (state) {
        copying = true;
        $('.copyTooltip').show('blind', {}, 100 );
    }
    else {
        copying = false;
        $('.copyTooltip').hide('blind', {}, 100 );
    }
}
function draggableObject(elem) {
    return {
        containment: 'parent',
        scroll: false,
        helper: function() {
            var div = $('<div id="groupselect">');
            div.css({
                position:'absolute', 
                'z-index':40,
            }).appendTo($('.field'));
            return div;
        },
        start: function ( event, ui ) {
            saveUndoState();
            var gs = $('#groupselect');
            selectState.dragging = true;
            if (!$(this).hasClass('selected')) {
                setSelectedElement(null, this);
                gs.append(this);
            }
            var min = {top: Infinity, left:Infinity};
            for (var i = 0; i < $('.field .selected').length; i++) {
                var sel = $('.field .selected').eq(i);
                if (min.top > parseFloat(sel.css('top'))) min.top = parseFloat(sel.css('top'));
                if (min.left > parseFloat(sel.css('left'))) min.left = parseFloat(sel.css('left'));
            }
            $('.field .selected').appendTo(gs);
            for (var i = 0; i < $('.field .connector:not(.etalon)').length; i++) {
                var connector = $('.field .connector:not(.etalon)').eq(i);
                var l = connector.data().left;
                var r = connector.data().right;
                if (gs.find('[data-id='+l+']').length == 1 && gs.find('[data-id='+r+']').length == 1) {
                    connector.addClass('appendIt');
                }
            }
            gs.append($('.connector.appendIt')).find('.connector').removeClass('appendIt');
            startPosition = {top: min.top, left: min.left};
            for (var i = 0; i < $('#groupselect>div').length; i++) {
                sel = $('#groupselect>div').eq(i);
                sel.css({
                    left: parseFloat(sel.css('left')) - min.left,
                    top:  parseFloat(sel.css('top'))  - min.top
                });
                
            }
        },
        drag: function ( event, ui ) {
            var gs = $('#groupselect');
            var __dx = ui.position.left - ui.originalPosition.left;
            var __dy = ui.position.top -  ui.originalPosition.top;
            ui.position.left = startPosition.left +  __dx;
            ui.position.top  = startPosition.top  +  __dy;
            if (ui.position.left < 0) ui.position.left = 0;
            if (ui.position.top < 0) ui.position.top = 0;
            var joined = false;
            var elements = gs.find('.element');
            for (var i = 0; i < elements.length; i++) {
                var sel = elements.eq(i);
                sel.data({
                    left:ui.position.left + parseFloat(sel.css('left')), 
                    top: ui.position.top + parseFloat(sel.css('top'))
                });
                countCoords(sel, true);
                if (!joined) joined = joinToConnection(sel, ui);
                else joinToConnection(sel, ui);
            }
            if (joined) {
                for (var i = 0; i < elements.length; i++) {
                    var sel = elements.eq(i);
                    sel.data({
                        left:ui.position.left + parseFloat(sel.css('left')), 
                        top: ui.position.top + parseFloat(sel.css('top'))
                    });
                    countCoords(sel, true);
                }
            }
        },
        stop:  function(event, ui) {
            selectState.dragging = false;
            for (var i = 0; i < $('#groupselect>div').length; i++) {
                var sel = $('#groupselect>div').eq(i);
                var pos = {
                    top: parseFloat(sel.css('top')), 
                    left: parseFloat(sel.css('left'))
                };
                sel.css({
                    top: ui.position.top + pos.top,
                    left: ui.position.left + pos.left,
                });
            }
            $('#groupselect>div').removeClass('appendIt').appendTo('.field');
            $('#groupselect').remove();
        }
    };
}
function joinToConnection(obj, ui) {
    //проверить, есть ли элемент, с которым надо соединиться и, если да, организовать его прилипание
    obj = $(obj);
    var gs = $('#groupselect');
    var tPoints = obj.data().points;
    var divs = $('.field>.element');
    var d = 20;
    var cornerCorrection = 6;
    var conn = {left: undefined, right: undefined};
    var dconn = obj.data().connections;
    if (dconn.left != undefined && $('#groupselect .selected[data-id='+dconn.left+']').length == 1) 
        conn.left = dconn.left;
    if (dconn.right != undefined && $('#groupselect .selected[data-id='+dconn.right+']').length == 1) 
        conn.right = dconn.right;
    if (conn.left != undefined && conn.right != undefined) return false;
    var connected = false;
    var id = obj.data().id;
    var angle = obj.data().angle;
    for (var i = 0; i < divs.length; i++) {
        var div = divs.eq(i);
        var points = div.data().points;
        var divAngle = div.data().angle;
        if (!angleMore90(angle, divAngle)) continue; //если угол при соединении будет <90, не коннектим
        var conns = div.data().connections;
        for (var j in tPoints) for (var k in points) {
            if (j == 0 && conn.left != undefined) continue;
            if (j == 1 && conn.right != undefined) continue;
            if (j == k) continue; //левые к левым/правые к правым не коннектятся, только правые к левым
            if (k == 0 && conns.left != undefined && conns.left != id) continue; 
            if (k == 1 && conns.right != undefined && conns.right != id) continue;
            var dx = tPoints[j].x - points[k].x;
            var dy = tPoints[j].y - points[k].y;
            if (Math.abs(dx) < d && Math.abs(dy) < d) {//коннектим
                if (gs.length == 0) var corr = {x:0,y:0};
                else corr = {x:parseFloat(obj.css('left')), y: parseFloat(obj.css('top'))};
                if (j == 1) {
                    var tDelta = {
                        x: tPoints[1].x - tPoints[0].x, 
                        y: tPoints[1].y - tPoints[0].y
                    };
                    ui.position.left = points[0].x - tDelta.x - corr.x - cornerCorrection;
                    ui.position.top =  points[0].y - tDelta.y - corr.y - cornerCorrection;
                    conn.right = div.data().id;
                    drawConnector(id, conn.right, points[0].x - cornerCorrection, points[0].y - cornerCorrection);
                    conns.left = id;
                    connected = true;
                }
                else {
                    ui.position.left = points[1].x - corr.x - cornerCorrection;
                    ui.position.top =  points[1].y - corr.y - cornerCorrection;
                    conn.left =  div.data().id;
                    drawConnector(conn.left, id, points[1].x - cornerCorrection, points[1].y - cornerCorrection);
                    conns.right = id;
                    div.addClass('noRotation');
                    connected = true;
                }
                div.data({connections: conns});
                obj.data({top: ui.position.top, left: ui.position.left});
                countCoords(obj, true);
            }
            else if ((k == 0 && conns.left == id) || (k == 1 && conns.right == id)) {
                if (k == 0) {
                    conns.left  = undefined;
                    $('.field>.connector:not(.etalon)[data-left='+id+']').remove();
                }
                if (k == 1) {
                    conns.right = undefined;
                    $('.field>.connector:not(.etalon)[data-right='+id+']').remove();
                    div.removeClass('noRotation');
                }
                div.data({connections: conns});
            }
        }
        countBill();
    }
    obj.data({connections:conn});
    if (conn.right == undefined) obj.removeClass('noRotation');
    else obj.addClass('noRotation');
    return connected;
}
Number.prototype.between = function(a, b) { 
    //да, добавлять свои функции в предопределенные типы нехорошо, но в этом случае реально очень хорошо сокращается код
    var min = Math.min(a,b);
    var max = Math.max(a,b);
    return min <= this && this <= max;
};
function countCoords(div, delta) {
    //расчитывает координаты точек для указанного элемента
    delta = undefined;
    div = $(div);
    var h = div.height();
    var h2 = Math.round(h/2);
    var x = div.data('left');
    var y = div.data('top');
    var points = [{
        x: x + h2, 
        y: y + h2
    }];
    if (delta == undefined) {
        var angle = div.data().angle;
        var l = div.width();
        var trig = {
            sin: Math.sin(angle),
            cos: Math.cos(angle)
        };
        points.push({
            x: points[0].x + l * trig.cos - h * trig.cos, 
            y: points[0].y + l * trig.sin - h * trig.sin
        });
    }
    else {
        var tPoints = div.data().points;
        var dx = tPoints[0].x - tPoints[1].x;
        var dy = tPoints[0].y - tPoints[1].y;
        points.push ({
            x: points[0].x - dx,
            y: points[0].y - dy
        });
    }
    
    div.data({points: points});
    return points;
}
function rotatableObject(elem, radians) {
    if (radians == undefined) radians = 0;
    rotateTitle(elem, radians);
    return {
        wheelRotate: false,
        radians: radians,
        handle: elem.find('.rotator'),
        rotationCenterOffset: {top: 8, left: 8},
        start: function() {
            saveUndoState();
            $(this).addClass('ui-rotating');
        },
        rotate: function(event, ui) {
            if ($(this).data().connections.right) return false;
            var radian = ui.angle.current;
            if (radian >  PI) radian = radian - 2*PI; //исправление ошибки с прокруткой нескольких кругов
            if (radian < -PI) radian = radian + 2*PI; 
            ui.angle.current = radian;
            //запрет на углы больше 90град
            if ($(this).data().connections && $(this).data().connections.left != undefined) {
                var id = $(this).data().connections.left;
                var divs = $('.field .element');
                for (var i = 0; i < divs.length; i++) if (divs.eq(i).data().id == id) break;
                var div = divs.eq(i);
                if (!angleMore90(radian, div.data().angle)) return false;
            }

            //прилипание на каждые 45 градусов
            var d = PI/32;
            var angles = [0, -PI/4, -PI/2, -3*PI/4, -PI, PI, 3*PI/4, PI/2, PI/4];
            for (var i in angles) {
                if (angles[i] - d <= radian && radian <= angles[i] + d) {
                    ui.angle.current = angles[i];
                    break;
                }
            }
            $(this).data('angle', ui.angle.current);
            countBill();
            countCoords(this);
            rotateTitle(elem, ui.angle.current);
        },
        stop: function(event, ui) {
            $(this).removeClass('ui-rotating');
            if (!$(this).hasClass('selected')) setSelectedElement(null, this);
        }
    }
}
function rotateTitle(elem, radians) {
    elem.find('.rotator .degrees')
        .css('transform','rotate('+(radians * - 1)+'rad)')
        .html(Math.abs(Math.round(radians * 180 / PI)) + '&deg;');
}
function drawConnector(id1, id2, left, top) {
    if ($('.field .connector[data-left='+id1+'][data-right='+id2+']').length > 0) return;
    var connector = $('.field .connector.etalon').clone().removeClass('etalon');
    connector.data({left: id1, right: id2})
             .css({top: top + 6, left: left + 6})
             .attr({'data-left': id1, 'data-right': id2})
             .appendTo('.field');
}
function loadField(save) {
    if (typeof save == 'undefined') save = /save=([^&]+)/.exec(window.location.href)[1];
    else save = save;
    if (save.length > 0) save = save.split('|');
    else save = [];
    $('.field').find('.element:not(.etalon), .connector:not(.etalon)').remove();
    for (var i in save) {
        var s = save[i].split(';');
        var obj = {
            id: parseInt(s[0]),
            name: decodeURIComponent(s[1]),
            color: s[2],
            top: parseFloat(s[3]),
            left: parseFloat(s[4]),
            angle: parseFloat(s[5]),
            connections: {
                left: (s[6] == "") ? undefined : parseInt(s[6]),
                right: (s[7] == "") ? undefined : parseInt(s[7])
            },
            width: parseFloat(s[8]),
            height: parseFloat(s[9]),
        };
        var div = $(".panel .element.etalon").clone().removeClass('etalon').addClass('notNew');
        div.appendTo($('.field'))
           .data(obj)
           .css({position: 'absolute', top: obj.top + 'px', left: obj.left + 'px'})
           .find('.length').text(obj.name);
        div.attr({
            'data-name': obj.name,
            'data-id': obj.id
        });
        div.height(obj.height).width(obj.width);
        colorizeElement(div, obj.color);
        countCoords(div);
        if (obj.connections.left != undefined) 
            drawConnector(obj.connections.left, obj.id, div.data().points[0].x - 6, div.data().points[0].y - 6);
        if (obj.connections.right != undefined)
            div.addClass('noRotation');
        div.draggable(draggableObject(div));
        div.rotatable(rotatableObject(div, obj.angle))
           .click(function(event) {setSelectedElement(event, this);});
        if (id < obj.id) id = obj.id;
    }
    id++;
    countBill();
    handleButtonsEnabling();
}
function printRulerNumbers() {
    var bgHeight = 250, bgWidth = 250;
    var web = $('.web');
    var etalon = web.find('.etalon');
    var webCSS = web.css('background-position').split(' ');
    var wHeight = $('.field').height();
    var bgPos = {
        x: parseInt(webCSS[0]),
        y: parseInt(webCSS[1])
    };
    var zero = [
        bgPos.x,
        bgPos.y + Math.floor((wHeight + bgPos.y) / bgHeight) * bgHeight
    ];
    addRulerNum(0, zero, true);
    var fWidth = $('.field').width();
    var fHeight = $('.field').height();
    var y = zero[1], val = 0;
    while((y -= bgHeight / 5) > 0) {
        val += 10;
        addRulerNum(val, [zero[0], y]);
    }
    var x = zero[0], val = 0;
    while((x += bgWidth / 5) < fWidth) {
        val += 10;
        addRulerNum(val, [x, zero[1]]);
    }
}
function addRulerNum(val, position) {
    var web = $('.web');
    var etalon = web.find('.etalon');
    var number = etalon.clone().removeClass('etalon').appendTo(web).text(val);
    if (val % 50 == 0) number.addClass('big');
    number.css({
        left: position[0] + 1 - number.outerWidth(true) / 2,
        top: position[1] + 1 -  number.outerHeight(true) / 2 
    });
}
function addMenuItems() {
    var shelfs = data.prices;
    var etalon = $('.element.etalon');
    for (var i in shelfs) {
        if (i == 'cap' || i == 'connection') continue;
        var div = etalon
                .clone(true)
                .removeClass('etalon')
                .appendTo(etalon.parent());
        div.css({width: parseInt(i) * 5 + 16 + 'px'});
        div.find('.length').text(i);
        div.attr({
            title: 'Полка ' + i + 'см',
            'data-name': i
        });
    }
    var colors = data.colors;
    var etalon = $('.panel .form.colors .color.etalon');
    for (var type in colors) {
        for (var i in colors[type]) {
            var div = etalon
                    .clone(true)
                    .removeClass('etalon')
                    .css('background-color',colors[type][i][0])
                    .attr('title',colors[type][i][1])
                    .appendTo('.form.colors .list.' + type)
                    .attr('data-color', colors[type][i][0].replace('#',''));
        }
    }
}
function openDialog(name) {
    var dialog = $('.dialogs .dialog.' + name);
    $('.dialogs, .dialogs .bg').show();
    dialog.show();
    dialog.css({
        left: ($(window).width() - dialog.outerWidth(true)) / 2,
        top: ($(window).height() - dialog.outerHeight(true)) / 2
    });
}
function closeDialog() {
    $('.dialogs .dialog:visible').hide();
    $('.dialogs, .dialogs .bg').hide();
}
function getLink() {
    var objects = $('.field .element.notNew');
    var strings = [];
    for (var i = 0; i < objects.length; i++) {
        var obj = objects.eq(i);
        var d = obj.data();
        var arr = [
            d.id, d.name, d.color, d.top, d.left, d.angle, d.connections.left, d.connections.right,
            obj.width(),obj.height()
        ];
        strings.push(arr.join(';'));
    }
    return strings.join('|');
}
function coloriseBG() {
    var HSL = $('.field .bg').data();
    $('.field .bg').css(
            'background-color', 
            'HSL(' + HSL.H + ', ' + HSL.S + '%, ' + HSL.L + '%)'
    );
    $('.field .web .number').css({
        'background-color': 'HSL(' + HSL.H + ', ' + HSL.S + '%, ' + HSL.L + '%)',
        //color: 'HSL(' + (360 - HSL.H) + ', ' + (100 - HSL.S) + '%, ' + (100 - HSL.L) + '%)'
    });
}
function saveUndoState() {
    saved.undo.push(getLink());
    if (saved.undo.length > 5) saved.undo.splice(0,1);
    saved.redo.splice(0);
    $('.button.redo').addClass('disabled');
    $('.button.undo').removeClass('disabled');
}