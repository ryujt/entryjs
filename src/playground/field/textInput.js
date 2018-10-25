'use strict';

Entry.FieldTextInput = function(content, blockView, index) {
    this._blockView = blockView;
    this.board = this._blockView.getBoard();
    this._block = blockView.block;

    this.box = new Entry.BoxModel();

    this.svgGroup = null;

    this.position = content.position;
    this._contents = content;
    this._isClearBG = content.clearBG || false;
    this._index = index;
    this.value = this.getValue() || '';
    this._CONTENT_HEIGHT = this.getContentHeight();
    this._font_size = 10;
    this._neighborFields = null;

    this.renderStart();
};

Entry.Utils.inherit(Entry.Field, Entry.FieldTextInput);

(function(p) {
    const TEXT_Y_PADDING = 3;

    p._focusNeighbor = function(direction) {
        const fields = this.getNeighborFields();

        let idx = fields.indexOf(this);
        if (direction === 'prev') {
            idx--;
        } else {
            idx++;
        }
        const field = fields[idx];

        //no field to focus
        if (!field) {
            return;
        }

        this.destroyOption(undefined, true);
        field.renderOptions(fields);
    };

    p.renderStart = function() {
        const blockView = this._blockView;

        if (!this.svgGroup) {
            this.svgGroup = blockView.contentSvgGroup.elem('g');
        }

        if (!this.textElement) {
            this.textElement = this.svgGroup.elem('text', {
                x: 0,
                y: TEXT_Y_PADDING,
                fill: this._contents.color || 'black',
                'font-size': `${this._font_size}px`,
                'font-weight': 'bold',
                'font-family': 'NanumGothic',
            });
        }

        this.svgGroup.attr({ class: 'entry-input-field' });

        this._setTextValue();

        const width = this.getTextWidth();
        let y = this.position && this.position.y ? this.position.y : 0;
        const CONTENT_HEIGHT = this._CONTENT_HEIGHT;
        y -= CONTENT_HEIGHT / 2;
        if (!this._header) {
            this._header = this.svgGroup.elem('rect', {
                width,
                x: 0,
                y,
                height: CONTENT_HEIGHT,
                rx: 0,
                ry: 3,
                fill: '#fff',
                'fill-opacity': 0,
            });
        } else {
            this._header.setAttribute('width', width);
        }

        if (this._isClearBG) {
            $(this._header).css({ stroke: 'none' });
        }

        this.svgGroup.appendChild(this.textElement);

        this._bindRenderOptions();

        this.box.set({
            x: 0,
            y: 0,
            width,
            height: CONTENT_HEIGHT,
        });
    };

    p.renderOptions = function(neighborFields) {
        if (neighborFields) {
            this._neighborFields = neighborFields;
        }

        const that = this;

        const func = function(skipCommand, forceCommand) {
            skipCommand !== true && that.applyValue();
            that.destroyOption(skipCommand, forceCommand === true);
        };

        this._attachDisposeEvent(func);

        this.optionGroup = Entry.Dom('input', {
            class: 'entry-widget-input-field',
            parent: $('body'),
        });

        this.optionGroup.val(this.getValue());

        this.optionGroup.on('mousedown', function(e) {
            e.stopPropagation();
        });

        const exitKeys = [13, 27];
        this.optionGroup.on('keyup', function(e) {
            that.applyValue(e);

            if (_.includes(exitKeys, e.keyCode || e.which)) {
                that.destroyOption(undefined, true);
            }
        });

        this.optionGroup.on('keydown', function(e) {
            const keyCode = e.keyCode || e.which;

            if (keyCode === 9) {
                e.preventDefault();
                that._focusNeighbor(e.shiftKey ? 'prev' : 'next');
            }
        });
        const { scale = 1 } = this.board;
        this._font_size = 10 * scale;
        const { x, y } = this.getAbsolutePosFromDocument();
        const height = (this._CONTENT_HEIGHT - 4) * scale;
        this.optionGroup.css({
            height,
            left: x + 1,
            top: y + (scale - 1) * 4 + 2 * scale - 1 * (scale / 2) - this.box.height / 2,
            width: that.box.width * scale,
            'font-size': `${this._font_size}px`,
            'background-color': EntryStatic.colorSet.block.lighten.CALC,
        });

        this.optionGroup.focus && this.optionGroup.focus();

        const optionGroup = this.optionGroup[0];
        optionGroup.setSelectionRange(0, optionGroup.value.length, 'backward');

        this.optionDomCreated();

        //normally option group is done editing and destroyed
        //before blur called
        this.optionGroup.one('blur', () => {
            return;
            this.isEditing() && this.destroyOption(undefined, true);
        });
    };

    p.applyValue = function() {
        this.setValue(this.optionGroup.val());
        this._setTextValue();
        this.resize();
    };

    p.resize = function() {
        const { scale = 1 } = this.board;
        const size = { width: this.getTextWidth() * scale };
        const scaleSize = { width: this.getTextWidth() };
        this._header.attr(scaleSize);
        this.box.set(scaleSize);
        this.optionGroup.css(size);
        this._blockView.dAlignContent();
    };

    p.getTextWidth = function() {
        return Math.max(this.getTextBBox().width, 7);
    };

    p._setTextValue = function() {
        const newValue = this._convert(this.getValue(), this.getValue());
        if (this.textElement.textContent !== newValue) {
            this.textElement.textContent = newValue;
        }
    };

    p.getNeighborFields = function() {
        if (!this._neighborFields) {
            const FIELD_TEXT_INPUT = Entry.FieldTextInput;
            this._neighborFields = this._block
                .getRootBlock()
                .getThread()
                .view.getFields()
                .filter((f) => {
                    return f instanceof FIELD_TEXT_INPUT;
                });
        }

        return this._neighborFields;
    };
})(Entry.FieldTextInput.prototype);
