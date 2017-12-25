/*
 *  This file is part of Moeditor.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *
 *  Moeditor is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Moeditor is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Moeditor. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

window.app = require('electron').remote.app;
window.moeApp = app.moeApp;
window.w = moeApp.newWindow;
require('electron-titlebar');

$(() => {
    const MoeditorPreview = require('./moe-preview');

    if (w.fileName !== '') {
        document.getElementsByTagName('title')[0].innerText = 'Moeditor - ' + require('path').basename(w.fileName);
    }
    document.querySelector('#editor textarea').innerText = w.content;

    var editor = CodeMirror.fromTextArea(document.querySelector('#editor textarea'), {
        lineNumbers: !!moeApp.config.get('editor-ShowLineNumber'),
        mode: moeApp.config.get('math') ? 'gfm_math' : 'gfm',
        matchBrackets: true,
        theme: moeApp.config.get('editor-theme'),
        lineWrapping: true,
        extraKeys: {
            Enter: 'newlineAndIndentContinueMarkdownList',
            Home: 'goLineLeft',
            End: 'goLineRight',
            'Shift-Tab': 'indentLess'
        },
        fixedGutter: false,
        tabSize: moeApp.config.get('tab-size'),
        indentUnit: moeApp.config.get('tab-size'),
        viewportMargin: Infinity,
        styleActiveLine: true,
        showCursorWhenSelecting: true
    });

    editor.focus();

    const scroll = require('./moe-scroll');

    window.updatePreview = (force) => {
        MoeditorPreview(editor, force, () => {
            scroll();
        });
    };

    editor.on('change', (editor, obj) => {
        window.updatePreview(false)
    });

    setTimeout(() => {
        window.updatePreview(true);
    }, 0);

    window.editor = editor;

    // workaround for the .button is still :hover after maximize window
    $('#cover-bottom .button-bottom').mouseover(function() {
        $(this).addClass('hover');
    }).mouseout(function() {
        $(this).removeClass('hover');
    }).click(function() {
        var s = $(this).data('action');
        if (s === 'menu') MoeditorSideMenu.open();
    });

    const s = require('electron').shell;

    const containerWrapper = document.getElementById('container-wrapper');
    document.addEventListener('keydown', (e) => {
        if ((process.platform === 'darwin' ? e.metaKey : e.ctrlKey) && e.keyCode == 65) {
            if (document.getElementById('editor').contains(e.target)) {
                return;
            } else if (containerWrapper.contains(e.target)) {
                let sel = window.getSelection();
                let rg = document.createRange();
                rg.selectNodeContents(containerWrapper);
                sel.removeAllRanges();
                sel.addRange(rg);
            }
            e.preventDefault();
        }
    });
    $("#container").on('click', 'a', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            const e = containerWrapper.querySelector(href);
            if (e) containerWrapper.scrollTop = e.offsetTop - 50; // 50 is the height of the top cover
        } else {
            s.openExternal(this.href);
        }
    });

    const leftPanel = document.getElementById('left-panel');
    leftPanel.addEventListener('click', (e) => {
        if (e.target === leftPanel) editor.focus();
    });

    // if (moeApp.config.get('focus-mode') === true) document.getElementById('editor').classList.add('focus');
    // document.getElementById('button-bottom-focus').addEventListener('click', function() {
    //     document.getElementById('editor').classList.toggle('focus');
    //     moeApp.config.set('focus-mode', document.getElementById('editor').classList.contains('focus'));
    // });

    require('electron').ipcRenderer.on('set-title', (e, fileName) => {
        document.getElementsByTagName('title')[0].innerText = 'Moeditor - ' + require('path').basename(fileName);
    });

    require('./moe-settings');

    w.window.show();

    // $(".CodeMirror-vscrollbar").hover(
    //     function () {
    //         $(this).addClass('hoverScroll')
    //     },
    //     function () {
    //         $(this).removeClass('hoverScroll')
    //     }
    // );

    $("#main-container div").mousemove(function (e) {
        // $('.scrolling').removeClass('scrolling');
        if(e.clientX + 100 > this.offsetWidth + this.offsetLeft)
            $(this).find('.CodeMirror-vscrollbar').addClass('hoverScroll');
        else {
            $(this).find('.CodeMirror-vscrollbar').removeClass('hoverScroll');
        }
    })

    $("#main-container div").hover(
        function (e) {
        }       ,
        function (e) {
            // $('.scrolling').removeClass('scrolling');
            $(this).find('.CodeMirror-vscrollbar').removeClass('hoverScroll');
        }
    )

    document.querySelectorAll('.CodeMirror-vscrollbar').forEach(
        function (item) {
            item .addEventListener("transitionend", function (e) {
                // if (e.propertyName == 'font-size'){
                    $('.scrolling').removeClass('scrolling');
                // }
            });

            item.addEventListener("scroll",function (e) {
                if ($(this.parentElement).is(':hover'))
                    $(this).addClass('scrolling');
                if ($(this).css('font-size') == '14px'){
                    $('.scrolling').removeClass('scrolling');
                }
            })
        }
    );


    document.getElementById("container").addEventListener("click", function () {
        var script = document.getElementById('dynamicScript');
        if (!script) {
            var rightpanel = document.getElementById('right-panel');
            var scripts = rightpanel.getElementsByTagName('script');
            if (script) {
                rightpanel.removeChild(script);
            }
            script = document.createElement('script');
            script.id = 'dynamicScript';
            script.text = '';
            for (var i = 0, len = scripts.length; i < len; i++) {
                script.text += scripts[i].innerHTML;
            }
            rightpanel.appendChild(script);
        }
    }, true);
});
