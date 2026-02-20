import { ITEMS } from './config.js';

export class Item {
    /**
     * @param {string} id - ITEMS定数のキー
     * @param {number} x - 配置X座標
     * @param {number} y - 配置Y座標
     * @param {object} options - 拡張オプション (type, ownerId など)
     */
    constructor(id, x, y, options = {}) {
        const def = ITEMS[id];
        if (!def) {
            console.error(`[Item] Definition not found for ID: ${id}`);
            // フォールバック
            this.id = id;
            this.type = options.type || 'item';
            this.size = 40;
        } else {
            this.id = id;
            this.type = def.type || options.type || 'item';
            this.size = def.size || (this.type === 'furniture' ? 100 : 40);
        }

        this.x = x;
        this.y = y;
        this.placedTime = Date.now();
        this.ownerId = options.ownerId || null;

        this.stage = 'default';
        this.displayText = (def && def.text) || null;
        this.textDisplayUntil = (def && def.text) ? Date.now() + 15000 : 0;

        // 耐久度（食べられる回数など）
        // notes.mdより: 食べ物系は指定回数で消える。デフォルトは無限(-1)か1回。
        // ここでは nutrition があるものを食べ物とみなし、デフォルト3回とする（configで個別設定も可能）
        this.maxDurability = (def && def.durability) || ((def && def.nutrition) ? 3 : -1);
        this.durability = this.maxDurability;

        // 寿命（秒指定をミリ秒に変換）
        this.lifespan = (def && def.lifespan) ? def.lifespan * 1000 : null;
    }

    /** 毎フレームの更新処理 */
    update(dt) {
        const now = Date.now();
        const def = ITEMS[this.id];

        // 1. 寿命チェック
        if (this.lifespan && (now - this.placedTime > this.lifespan)) {
            return { action: 'delete' };
        }

        // 2. 変化（Transform）チェック
        if (def && def.transform && (now - this.placedTime > def.transform.duration)) {
            return { action: 'transform', transform: def.transform };
        }

        return { action: 'none' };
    }

    /** 描画処理 */
    draw(ctx, images) {
        const def = ITEMS[this.id];
        if (!def) return;

        // 画像の描画
        const imgKey = def.imagefile ? def.imagefile.replace('.png', '') : '';
        const img = images[imgKey] || images[`assets/images/${def.imagefile}`];

        if (img) {
            ctx.save();

            // 耐久度に応じた視覚フィードバック (薄くなっていく)
            if (this.maxDurability > 0 && this.durability < this.maxDurability) {
                ctx.globalAlpha = 0.2 + (this.durability / this.maxDurability) * 0.8;
            }

            ctx.drawImage(img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }

        // 吹き出しテキストの描画
        if (this.displayText && Date.now() < this.textDisplayUntil) {
            this._drawText(ctx);
        }
    }

    /** 食べられる、使用されるなどのアクション */
    consume() {
        if (this.maxDurability <= 0) return false; // 消耗しない

        this.durability--;
        return this.durability <= 0; // trueなら消滅
    }

    /** テキスト描画ヘルパー */
    _drawText(ctx) {
        ctx.save();
        ctx.font = "bold 18px 'Zen Maru Gothic', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        const textY = this.y - this.size / 2 - 10;
        ctx.strokeText(this.displayText, this.x, textY);
        ctx.fillText(this.displayText, this.x, textY);
        ctx.restore();
    }
}
