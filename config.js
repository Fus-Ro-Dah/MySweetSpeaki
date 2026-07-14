/**
 * My Sweet Speaki - 設定と定数
 */

// 状態定数の定義
export const STATE = {
    // 基本的な行動
    IDLE: 'idle',
    WALKING: 'walking',

    // お土産イベント
    GIFT_LEAVING: 'gift_leaving',
    GIFT_SEARCHING: 'gift_searching',
    GIFT_RETURNING: 'gift_returning',
    GIFT_WAIT_FOR_USER_REACTION: 'gift_wait_for_user_reaction',
    GIFT_REACTION: 'gift_reaction',
    GIFT_TIMEOUT: 'gift_timeout',

    // アイテムインタラクション
    ITEM_APPROACHING: 'item_approaching',
    ITEM_ACTION: 'item_action',

    // ユーザーインタラクション
    USER_INTERACTING: 'user_interacting',

    // スピキ同士のインタラクション
    GAME_APPROACHING: 'game_approaching',
    GAME_REACTION: 'game_reaction',

    // 特殊能力(アイテム配置など)
    ABILITY_ACTION: 'ability_action',

    // 死亡・輪廻
    DYING: 'dying'
};

/**
 * 統合アセット定義 (ASSETS)
 * 形式: [キャラタイプ][カテゴリ][感情/ターゲット][アクション] = [バリエーション...]
 * スピキのtextは大体半角のカタカナであることに注意
 */
export const ASSETS = {
    //大人のｽﾋﾟｷ
    speaki: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'stretch' },
                    { imagefile: 'speaki_normal_idle_3.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_normal_idle_4.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_3.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_4.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_normal_idle_5.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'stretch' },
                ],
                walking: [
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_walking_3.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_walking_2.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_normal_walking_2.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'stretch' },
                    { imagefile: 'speaki_normal_walking_2.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_walking_3.png', soundfile: 'チョワヨ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_normal_walking_4.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'stretch' },
                ]
            },
            happy: {
                idle: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'fast_swing' },
                    { imagefile: 'speaki_happy_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_4.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_idle_5.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'fast_swing' },
                    { imagefile: 'speaki_happy_idle_6.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ｽﾝﾊﾞｺｯﾁﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'fast_swing' },
                    { imagefile: 'speaki_happy_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_4.png', soundfile: 'チョワヨ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_idle_5.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_idle_6.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ｽﾝﾊﾞｺｯﾁﾁｮﾜﾖｰ', movePattern: 'stretch' },
                    { imagefile: 'speaki_happy_idle_7.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖｰ', movePattern: 'bounce' },
                ],
                walking: [
                    { imagefile: 'speaki_happy_walking_1.png', soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_3.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_4.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_5.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_walking_1.png', soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_walking_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_walking_3.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_walking_4.png', soundfile: 'チョワヨ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'fast_swing' },
                    { imagefile: 'speaki_happy_walking_5.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' }
                ],
                giftwait: [
                    { imagefile: 'speaki_happy_giftwait.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!!!!!', movePattern: 'none' }
                ]
            },
            sad: {
                idle: [
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: '完全詠唱.mp3', text: '完全詠唱', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_2.png', soundfile: 'デルジバゼヨ.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: 'ウアアスピキデルジバゼヨ.mp3', text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_4.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_5.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'twitch' },
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: '完全詠唱.mp3', text: '完全詠唱', movePattern: 'twitch' },
                    { imagefile: 'speaki_sad_idle_2.png', soundfile: 'デルジバゼヨ.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'vibrate' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: 'ウアアスピキデルジバゼヨ.mp3', text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'vibrate' },
                    { imagefile: 'speaki_sad_idle_4.png', soundfile: '本場スピキ叩きpp.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_5.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'twitch' },
                    { imagefile: 'speaki_sad_idle_6.png', soundfile: 'デルジバゼヨ.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'vibrate' },
                    { imagefile: 'speaki_sad_idle_7.png', soundfile: 'ウアアスピキデルジバゼヨ.mp3', text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_8.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'twitch' },
                    { imagefile: 'speaki_sad_idle_6.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'twitch' },
                    { imagefile: 'speaki_sad_idle_9.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                ],
                walking: [
                    { imagefile: 'speaki_sad_walking_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_3.png', soundfile: '本場スピキ叩き.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_2.png', soundfile: 'ネルニドチャガヌ.mp3', text: 'ｱｰｳ', movePattern: 'vibrate' },
                    { imagefile: 'speaki_sad_walking_3.png', soundfile: 'スピキヲトンゴエヨ.mp3', text: 'ｱｰｳ', movePattern: 'vibrate' },
                    { imagefile: 'speaki_sad_walking_4.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'vibrate' },
                    { imagefile: 'speaki_sad_walking_5.png', soundfile: 'ネルリタタセヨ.mp3', text: 'ｱｰｳ', movePattern: 'twitch' },
                    { imagefile: 'speaki_sad_walking_2.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯ……', movePattern: 'twitch' },
                    { imagefile: 'speaki_sad_walking_4.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ', movePattern: 'vibrate' },
                    { imagefile: 'speaki_sad_walking_1.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…', movePattern: 'twitch' },
                ]
            }
        },
        performance: {
            ITEM: {
                ToyPumpkin: [
                    { imagefile: 'speaki_action_toypumpkin.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'ホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'fast_swing' },
                    { imagefile: 'speaki_happy_idle_3.png', soundfile: '本場スピキくすぐり.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'fast_swing' },
                    { imagefile: 'speaki_happy_idle_4.png', soundfile: 'チョンチュドーン.mp3', text: 'ﾁｮﾝﾁｭﾄﾞｰﾝ!', movePattern: 'dance' },
                    { imagefile: 'speaki_action_toypumpkin.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' }
                ],
                Wimple: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' }],
                DeathWimple: [{ imagefile: 'speaki_sad_idle_5.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'shake' }],
                Candy: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'もぐもぐ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },

                ],
                Mocaron: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'ドグンジマッチャブセーヤ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },

                ],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'これを食べて眠気を覚ますにゃん', movePattern: 'swing' }],
                Shionmelone: [
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_2.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'lean' },
                    { imagefile: 'speaki_sad_idle_4.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'lean' },
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'vibrate' },
                ],
                LeviDriver: [
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_2.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'lean' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: 'スピキチャリゼヨ.mp3', text: 'ｳｱｱ!', movePattern: 'lean' },
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: 'スピキチャリゼヨ.mp3', text: 'ｳｱｱ!', movePattern: 'vibrate' },
                ],
                BrokenHobagi: [
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'vibrate' },
                ],
                Poteto: [
                    { imagefile: 'speaki_item_poteto.png', soundfile: '本場スピキ撫で.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_item_poteto.png', soundfile: 'もぐもぐ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'fast_swing' },

                ],
                NPC_action_HobagiSpeaki: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'lean' }
                ],
                NPC_action_ChickenSpeaki: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'スピキチャリゼヨ.mp3', text: 'ｳｱｱ!', movePattern: 'lean' }
                ],
                NPC_action_SheepSpeaki: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'スピキチャリゼヨ.mp3', text: 'ｳｱｱ!', movePattern: 'lean' }
                ],
                NPC_action_PoemerVivi: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'lean' }
                ],
                NPC_action_Uninse: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }
                ],
                StrangeRecord1: [
                    { imagefile: 'action_strangerecord_1.gif', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' }
                ],
                StrangeRecord2: [
                    { imagefile: 'action_strangerecord_1.gif', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' }
                ],
                generic: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'チョワヨ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_3.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                ]
            },
            action: {
                dance: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'dance' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ｽﾝﾊﾞｺｯﾁﾁｮﾜﾖｰ!', movePattern: 'dance' },
                ],
                hop: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'hop' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ｽﾝﾊﾞｺｯﾁﾁｮﾜﾖｰ!', movePattern: 'hop' },
                ],
                jump: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'jump' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ｽﾝﾊﾞｺｯﾁﾁｮﾜﾖｰ!', movePattern: 'jump' },
                ],
                feed: [
                    { imagefile: 'speaki_performance_feed.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                ],
                givecandy1: [
                    { imagefile: 'speaki_performance_givecandy1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                ],
                givecandy1_2: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'bounce' },
                ],
                givecandy2: [
                    { imagefile: 'speaki_performance_givecandy2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                ],
                givecandy3: [
                    { imagefile: 'speaki_performance_givecandy3.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                ]
            },
            happy: {
                idle: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                giftreaction: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: '本場スピキくすぐり.mp3', text: '(ｽﾋﾟｷはとっても満足げだ)', movePattern: 'swing' }]
            },
            normal: {
                idle: [{ imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ?', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ!', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_sad_surprised_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｯ!', movePattern: 'shake' }],
                gifttimeout: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ……', movePattern: 'shake' }]
            }
        }
    },
    //子供のスピキ（大人と同じ画像を使用する）
    child: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'fast_swing' },
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_3.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_4.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'pulse' },
                    { imagefile: 'speaki_normal_idle_5.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'stretch' },
                ],
                walking: [
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_normal_walking_2.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_normal_walking_3.png', soundfile: 'チョワヨ2.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_walking_4.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'bounce' },
                ]
            },
            happy: {
                idle: [
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'speaki_happy_idle_7.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖｰ', movePattern: 'bounce' },
                ],
                giftreaction: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: '本場スピキくすぐり.mp3', text: '(ｽﾋﾟｷはとっても満足げだ)', movePattern: 'swing' }]
            },
            sad: {
                idle: [
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｳｱｱ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: '赤ちゃん泣き.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_4.png', soundfile: 'ヌンデ.mp3', text: 'ﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_6.png', soundfile: 'アーウ.mp3', text: 'ｳｱｱ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_7.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_8.png', soundfile: '赤ちゃん泣き.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_9.png', soundfile: 'ヌンデ.mp3', text: 'ﾇﾝﾃﾞ...', movePattern: 'shake' },
                ],
                walking: [
                    { imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｳｱｱ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_3.png', soundfile: '赤ちゃん泣き.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_idle_4.png', soundfile: 'ヌンデ.mp3', text: 'ﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_4.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_5.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…', movePattern: 'shake' },
                ],
                surprised: [
                    { imagefile: 'speaki_sad_surprised_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｯ!', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_surprised_2.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｯ!', movePattern: 'shake' }
                ],
                gifttimeout: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ……', movePattern: 'shake' }]
            }
        },
        performance: {
            normal: {
                idle: [
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ!', movePattern: 'swing' }
                ],
                walking: [{ imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'speaki_normal_idle_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ！？', movePattern: 'bounce' }]
            },
            happy: {
                idle: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                walking: [{ imagefile: 'speaki_happy_walking_2.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｰｳ...', movePattern: 'shake' }],
                walking: [{ imagefile: 'speaki_sad_walking_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ...', movePattern: 'shake' }],
                surprised: [{ imagefile: 'speaki_sad_surprised_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｯ！', movePattern: 'shake' }]
            },
            ITEM: {
                ToyPumpkin: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                DeathWimple: [{ imagefile: 'speaki_sad_idle_5.png', soundfile: 'ひきつけ.mp3', text: '…………', movePattern: 'shake' }],
                Candy: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                Mocaron: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'これを食べて眠気を覚ますにゃん', movePattern: 'swing' }],
                Shionmelone: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                LeviDriver: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                BrokenHobagi: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'bounce' }],
                Poteto: [{ imagefile: 'speaki_item_poteto.png', soundfile: '本場スピキ撫で.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                generic: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            },
            happy: {
                dance: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾋﾟｷﾋﾟｷ!', movePattern: 'dance' }],
                jump: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾋﾟｷﾋﾟｷ!', movePattern: 'jump' }],
                feed: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'スピキ.mp3', text: 'あーん!', movePattern: 'swing' }]
            }
        }
    },
    //赤ちゃんスピキ（画像素材が足りないため、normal、idleの画像を使い回している）
    baby: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '赤ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '赤アーウ.mp3', text: 'ｱｰｳ…', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_2.png', soundfile: '赤ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_3.png', soundfile: '赤アーウ.mp3', text: 'ｱｰｳ…', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_4.png', soundfile: '赤ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_5.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_6.png', soundfile: '赤ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_7.png', soundfile: '赤アーウ.mp3', text: 'ｱｰｳ…', movePattern: 'bounce' }
                ],
                walking: [
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '赤チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_2.png', soundfile: '赤チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_3.png', soundfile: '赤ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_4.png', soundfile: '赤アーウ.mp3', text: 'ｱｰｳ!', movePattern: 'bounce' }
                ]
            },
            happy: {
                idle: [
                    { imagefile: 'baby_happy_idle_1.png', soundfile: '赤チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
                    { imagefile: 'baby_happy_idle_1.png', soundfile: '赤チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'baby_happy_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'none' },
                    { imagefile: 'baby_happy_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'none' },
                    { imagefile: 'baby_happy_idle_2.png', soundfile: '赤チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'baby_happy_idle_3.png', soundfile: '赤ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_happy_idle_4.png', soundfile: '赤チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }
                ],
                walking: [
                    { imagefile: 'baby_happy_idle_1.png', soundfile: '赤チョワヨ.mp3', text: '…ﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'baby_happy_idle_2.png', soundfile: '赤チョワヨ.mp3', text: '…ﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'baby_happy_idle_3.png', soundfile: '赤ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' }
                ]
            },
            sad: {
                idle: [
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '赤アーウ.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' },
                    { imagefile: 'baby_sad_idle_1.png', soundfile: '赤アーウ.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' },
                    { imagefile: 'baby_sad_idle_2.png', soundfile: '赤ちゃん泣き.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' },
                    { imagefile: 'baby_sad_idle_3.png', soundfile: '赤ヌンデ.mp3', text: 'ﾇﾝﾃﾞ...', movePattern: 'shake' }
                ],
                walking: [
                    { imagefile: 'baby_normal_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '赤ちゃん泣き.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'shake' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'shake' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'shake' },
                    { imagefile: 'baby_sad_idle_1.png', soundfile: '赤アーウ.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' },
                    { imagefile: 'baby_sad_idle_2.png', soundfile: '赤ちゃん泣き.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' },
                    { imagefile: 'baby_sad_idle_3.png', soundfile: '赤ヌンデ.mp3', text: 'ﾇﾝﾃﾞ...', movePattern: 'shake' }
                ]
            }
        },
        performance: {
            ITEM: {
                generic: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: '…ﾜﾖ!', movePattern: 'bounce' }]
            },
            action: {
                eat: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'もぐもぐ.mp3', text: 'もぐもぐ', movePattern: 'bounce' }]
            },
            happy: {
                eat: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'もぐもぐ.mp3', text: 'もぐもぐ', movePattern: 'bounce' }],
                dance: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: '…ﾜﾖ!', movePattern: 'dance' }],
                jump: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: '…ﾜﾖ!', movePattern: 'jump' }]
            },
            normal: {
                idle: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'スピキ.mp3', text: '…', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ!!', movePattern: 'shake' }]
            },
            sad: {
                idle: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ...', movePattern: 'bounce' }],
                surprised: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' }]
            }
        }
    },
    //NPC ごはん係のポーシャー
    posher: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'posher_idle_1.png', soundfile: 'さつまいも.mp3', text: 'さつまいも', movePattern: 'bounce' },
                    { imagefile: 'posher_idle_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'none' },
                    { imagefile: 'posher_idle_2.png', soundfile: 'いももかぼちゃのなかまでしょ.mp3', text: 'いももかぼちゃのなかまでしょ？', movePattern: 'bounce' }
                ],
                walking: [
                    //idleもwalkingも同じ画像としている
                    { imagefile: 'posher_idle_1.png', soundfile: 'さつまいもかぼちゃ.mp3', text: 'さつまいもかぼちゃ', movePattern: 'none' },
                    { imagefile: 'posher_idle_2.png', soundfile: 'いいわよ_ポーシャー.mp3', text: 'いいわよ', movePattern: 'none' }
                ]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'posher_idle_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' }],
                walking: [{ imagefile: 'posher_idle_2.png', soundfile: 'いももかぼちゃのなかまでしょ.mp3', text: 'いももかぼちゃのなかまでしょ？', movePattern: 'bounce' }],
                place_item: [{ imagefile: 'posher_action.gif', soundfile: '給餌8秒.mp3', text: 'どーぞ！', movePattern: 'none' }]
            }
        }
    },
    //NPC uninse
    uninse: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'uninse_idle_1.png', soundfile: 'ウニンセです.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_idle_2.png', soundfile: 'ウニンセです.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_idle_3.png', soundfile: '私の名前はウニンセです.mp3', text: '・・・', movePattern: 'none' },
                    { imagefile: 'uninse_idle_4.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_idle_5.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_idle_6.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_idle_7.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_idle_8.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'none' },
                    { imagefile: 'uninse_idle_9.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' }
                ],
                walking: [
                    { imagefile: 'uninse_walking_1.png', soundfile: 'ウニンセです.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_walking_2.png', soundfile: 'ウニンセです.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_walking_3.png', soundfile: '私の名前はウニンセです.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_walking_4.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_walking_5.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_walking_6.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_walking_7.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_walking_8.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_walking_9.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' },
                    { imagefile: 'uninse_walking_10.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'swing' },
                    { imagefile: 'uninse_walking_11.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' }
                ]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'uninse_idle_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' }],
                walking: [{ imagefile: 'uninse_walking_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'none' }],
                place_item: [{ imagefile: 'uninse_idle_1.png', soundfile: '無音08.mp3', text: 'ウニンセ！', movePattern: 'bounce' }]
            }
        }
    },
    vibinggabia: {
        mood: {
            normal: {
                idle: [{ imagefile: 'vibinggabia_idle_1.png', soundfile: '無音50.mp3', text: 'バイブスだなあ！', movePattern: 'bounce' }],
                walking: [{ imagefile: 'vibinggabia_idle_1.png', soundfile: '無音50.mp3', text: 'バイブスだなあ！', movePattern: 'bounce' }]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'vibinggabia_idle_1.png', soundfile: '無音50.mp3', text: 'バイブスだなあ！', movePattern: 'bounce' }],
                walking: [{ imagefile: 'vibinggabia_idle_1.png', soundfile: '無音50.mp3', text: 'バイブスだなあ！', movePattern: 'bounce' }],
                place_item: [{ imagefile: 'vibinggabia_idle_1.png', soundfile: '無音50.mp3', text: 'バイブスだなあ！', movePattern: 'bounce' }]
            }
        }
    },
    chickenspeaki: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'chickenspeaki_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'chickenspeaki_idle_2.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'chickenspeaki_idle_3.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'chickenspeaki_idle_4.png', soundfile: '無音08.mp3', text: '……', movePattern: 'none' }
                ],
                walking: [
                    { imagefile: 'chickenspeaki_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }
                ]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'chickenspeaki_idle_3.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' }],
                walking: [{ imagefile: 'chickenspeaki_walking_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'none' }],
                place_item: [{ imagefile: 'chickenspeaki_idle_3.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            }
        }
    },
    sheepspeaki: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'sheepspeaki_idle_1.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'sheepspeaki_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'sheepspeaki_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'sheepspeaki_idle_4.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'sheepspeaki_idle_5.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'bounce' }
                ],
                walking: [
                    { imagefile: 'sheepspeaki_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'sheepspeaki_walking_2.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' }
                ]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'sheepspeaki_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ?', movePattern: 'bounce' }],
                walking: [{ imagefile: 'sheepspeaki_walking_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'none' }],
                place_item: [{ imagefile: 'sheepspeaki_idle_3.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            }
        }
    },
    hobagispeaki: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'hobagispeaki_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'hobagispeaki_idle_2.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'hobagispeaki_idle_3.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
                    { imagefile: 'hobagispeaki_idle_4.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'bounce' },
                    { imagefile: 'hobagispeaki_idle_5.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }
                ],
                walking: [
                    { imagefile: 'hobagispeaki_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'hobagispeaki_walking_2.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'hobagispeaki_walking_3.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
                    { imagefile: 'hobagispeaki_walking_4.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'bounce' }
                ]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'hobagispeaki_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ?', movePattern: 'bounce' }],
                walking: [{ imagefile: 'hobagispeaki_walking_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'none' }],
                place_item: [{ imagefile: 'hobagispeaki_idle_3.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
            }
        }
    },
    poemervivi: {
        mood: {
            normal: {
                idle: [{ imagefile: 'poemervivi_idle_1.png', soundfile: '無音08.mp3', text: '・・・', movePattern: 'bounce' }],
                walking: [{ imagefile: 'poemervivi_idle_1.png', soundfile: '無音08.mp3', text: '風情のかけらもありませんわね！', movePattern: 'none' }]
            }
        },
        performance: {
            normal: {
                idle: [{ imagefile: 'poemervivi_idle_1.png', soundfile: '無音08.mp3', text: 'オーッホッホ！', movePattern: 'bounce' }],
                walking: [{ imagefile: 'poemervivi_idle_1.png', soundfile: '無音08.mp3', text: '詫び寂びを教えて差し上げますわ！', movePattern: 'none' }],
                place_item: [{ imagefile: 'poemervivi_idle_1.png', soundfile: '無音08.mp3', text: '風流ですわ！', movePattern: 'bounce' }]
            }
        }
    }
};

/**
 * アイテム定義 (ITEMS)
 * 
 * [特殊な設定項目]
 * - isLockedItem: true にすると機能解放メニューの対象になります
 * - unlockDesc: 解放メニューに表示する説明文 \n で改行、HTMLタグ(<a>等)も使用可能です
 * - unlockPrice: 解放に必要なプラスチック数
 * 
 * 例:
 * unlockDesc: `1行目の説明\n2行目の説明\n<a href="..." target="_blank">リンク</a>`
 */
export const ITEMS = {
    //かぼちゃ
    ToyPumpkin: {
        name: ' ﾎﾊﾞｷﾞのおもちゃ',         //メニューに表示する名前
        imagefile: 'item_toypumpkin.png',  //使用する画像ファイル
        text: '',                       //配置時に表示するテキスト
        size: 180,                      //サイズ
        showInMenu: true,               //メニューに表示するか
        isLockedItem: false,            //機能解放には載せない
        isFood: false,                  //食べ物かどうか
        friendshipChange: 10,           //友好度の変化量
        moodGain: 10,                   //機嫌の変化量
        forcedEmotion: 'happy'          //反応したｽﾋﾟｷがどんな感情になるか(この感情は10秒持続する)
    },

    //ウィンプル
    Wimple: {
        name: 'ウィンプル',
        imagefile: 'item_wimple.png',
        text: '',
        size: 80,
        showInMenu: true,
        isLockedItem: false,
        isFood: false,
        moodGain: 5,
        forcedEmotion: 'happy',
        transform: { isAdult: 'baby', duration: 10000 },
    },
    //スピキが死んだ場所に生成されるウィンプル (DeathWimple)
    DeathWimple: {
        name: 'ウィンプル',
        imagefile: 'item_wimple.png',
        text: '',
        size: 80,
        showInMenu: false,
        isFood: false,
        moodGain: -10,
        forcedEmotion: 'sad',
        transform: { isAdult: 'baby', duration: 10000 },
    },
    //食べ物アイテム
    Candy: {
        name: 'キャンディ',
        imagefile: 'item_キャンディ.png',
        size: 100,
        text: '',
        showInMenu: true,
        isLockedItem: false,
        nutrition: 15,
        isFood: true,
        friendshipChange: 2,
        moodGain: 5,
        forcedEmotion: 'happy',
        reloadTime: 10000,     //配置してから次に配置できるようになるまでの時間
    },
    Mocaron: {
        name: 'モカロン',
        imagefile: 'item_モカロン.png',
        size: 100,
        text: '',
        isLockedItem: true, // 個別解放対象にする
        showInMenu: false, // 初期は非表示
        nutrition: 25,
        isFood: true,
        friendshipChange: 5,
        moodGain: 5,
        forcedEmotion: 'happy',
        reloadTime: 20000,
        unlockDesc: 'キャンディより栄養価が高い<br>ｽﾋﾟｷたちも喜ぶ<br>でもレベルは上がらない',
        unlockPrice: 1
    },
    Poteto: {
        name: 'さつまいも',
        imagefile: 'item_poteto.png',
        size: 100,
        text: '',
        showInMenu: false, // 右メニューには出さない
        nutrition: 40,
        isFood: true,
        friendshipChange: 8,
        moodGain: 5,
        forcedEmotion: 'happy'
    },
    AnimalCan: {
        name: 'アニマル缶',
        imagefile: 'item_アニマル缶.png',
        soundfile: 'コミーだってやるときはやるにゃん.mp3',
        size: 100,
        text: '',
        isLockedItem: true,  //ランダムアイテムであることを示すもの
        showInMenu: false,
        reloadTime: 0,
        unlockDesc: 'コミーがすきなやつ<br>でもｽﾋﾟｷは食べない<br>不思議な形の石だと思っているようだ',
        unlockPrice: 1
    },
    Shionmelone: {
        name: 'シオン・ザ・DB',
        imagefile: 'item_シオン・ザ・メロンブレッド.png',
        soundfile: 'シオン口上視線が泳いでいるぞ.mp3',
        size: 150,
        text: '我が崩壊するゥ!',
        isLockedItem: true,
        isFood: false,
        forcedEmotion: 'happy',
        showInMenu: false,
        reloadTime: 0,
        unlockDesc: 'ダークベーカリーからの刺客<br><a href="https://youtu.be/Py06vYKp4EY?si=V2BOhdAMiVH_Rvh1" target="_blank">【GB素材】シオン・ザ・ダークブレッド(使用例付き) by 私はエビィ様</a>',
        unlockPrice: 1
    },
    LeviDriver: {
        name: '工具',
        imagefile: 'item_レヴィドライバー.png',
        soundfile: 'レヴィドライバー.mp3',
        size: 100,
        text: 'ｱ"ｱ"ｱ"ｱ"ｱ"ｱ"ｱ"ｱ"ｱ"ｱ"ｱ"ｱ"!',
        isLockedItem: true,
        isFood: false,
        showInMenu: false,
        reloadTime: 0,
        unlockDesc: 'たぶんマ○タ製<br><a href="https://youtu.be/WsQKUin6sb0?si=lltZElvtIdY4qbA6" target="_blank">電動レヴィドライバーの音声 by 私はエビィ様</a>',
        unlockPrice: 1,
        transform: { nextId: 'LeviDriver', duration: 60000 }
    },
    MasterStatue: {
        name: '教主像',
        imagefile: 'item_master.png',
        text: '',
        size: 180,
        isLockedItem: true,
        showInMenu: false,
        isFood: false,
        friendshipChange: 0,
        moodGain: 0,
        forcedEmotion: 'happy',
        unlockDesc: 'ｽﾋﾟｷにとってのあなたの象徴<br>あなたのことが好きなｽﾋﾟｷは 自然とこれに触れたがる<br>配置されていると ｽﾋﾟｷたちの好感度が減らなくなる',
        unlockPrice: 8
    },

    BrokenHobagi: {
        name: 'かぼちゃ粥',
        imagefile: 'item_かぼちゃ粥.png',
        size: 100,
        isLockedItem: true,
        isFood: false,
        moodGain: -35,
        forcedEmotion: 'sad',
        showInMenu: false,
        reloadTime: 0,
        unlockDesc: '友達だったもの',
        unlockPrice: 1
    },
    StrangeRecord1: {
        name: '奇妙なレコード',
        imagefile: 'item_strangerecord_1.png',
        size: 100,
        isLockedItem: true,
        isFood: false,
        moodGain: 5,
        forcedEmotion: 'happy',
        showInMenu: false,
        reloadTime: 0,
        unlockDesc: '謎のレコード。音楽につられて意外な誰かがやってくるかも (ソースは"開発メモ・引用"に記載)',
        unlockPrice: 1,
        transform: { nextId: 'StrangeRecord2', duration: 10000 }
    },
    StrangeRecord2: {
        name: '奇妙なレコード',
        imagefile: 'item_strangerecord_2.png',
        size: 100,
        isLockedItem: false,
        isFood: false,
        moodGain: 5,
        forcedEmotion: 'happy',
        showInMenu: false,
        transform: { nextId: 'StrangeRecord1', duration: 10000 },
        summonNPC: {
            npcType: 'vibinggabia',
            duration: 4000,
            offsetX: 50,
            offsetY: 0
        }
    },
    LeetsHead: {
        name: 'ゆっくりリッツ',
        imagefile: 'item_leetshead.png',
        size: 300,
        isLockedItem: true,
        isFood: false,
        moodGain: 5,
        forcedEmotion: 'happy',
        showInMenu: false,
        unlockDesc: '某サイトの不具合により誕生した奇妙なリッツ',
        unlockPrice: 1
    },
    NPC_action_HobagiSpeaki: {
        name: 'NPCホバギスピキ',
        imagefile: 'transparent.png',
        size: 100,
        isFood: false,
        moodGain: 0,
        forcedEmotion: 'happy',
        showInMenu: false,
        unlockPrice: 1,
        lifespan: 5
    },
    NPC_action_ChickenSpeaki: {
        name: 'NPCトリスピキ',
        imagefile: 'transparent.png',
        size: 100,
        isFood: false,
        moodGain: 0,
        forcedEmotion: 'happy',
        showInMenu: false,
        unlockPrice: 1,
        lifespan: 5
    },
    NPC_action_SheepSpeaki: {
        name: 'NPC羊スピキ',
        imagefile: 'transparent.png',
        size: 100,
        isFood: false,
        moodGain: 0,
        forcedEmotion: 'happy',
        showInMenu: false,
        unlockPrice: 1,
        lifespan: 5
    },
    NPC_action_PoemerVivi: {
        name: 'NPC俳人ヴィヴィ',
        imagefile: 'transparent.png',
        size: 100,
        isFood: false,
        moodGain: 0,
        forcedEmotion: 'happy',
        showInMenu: false,
        unlockPrice: 1,
        lifespan: 5
    },
    NPC_action_Uninse: {
        name: 'NPCウニンセ',
        imagefile: 'transparent.png',
        size: 100,
        isFood: false,
        moodGain: 0,
        forcedEmotion: 'happy',
        showInMenu: false,
        unlockPrice: 1,
        lifespan: 5
    },
};

/**
 * 機能解放データ (UNLOCK_DATA)
 */
export const UNLOCK_DATA = {
    feeder: {
        name: 'ごはん係 (給餌係)',
        price: 1,
        desc: '空腹で動けなくなっているスピキにご飯をあげる係を呼びます<br><a href="https://www.youtube.com/watch?v=1iDmiupE2x8" target="_blank">ぽっぴっポーシャーBB.ps3【使用例あり】 by オムチソバ!?様</a>'
    },
    uninse: {
        name: 'ともだち（ウニンセ）',
        price: 1,
        desc: 'ﾄﾘｯｶﾙが流行りますよ（予言）<br> うに（海産物）<br> <a href="https://www.youtube.com/watch?v=eUHXqrROU18" target="_blank">ｽﾋﾟｷとウニンセ by minmi様</a>'
    },
    chickenspeaki: {
        name: 'ともだち（トリスピキ）',
        price: 1,
        desc: '鳥っぽいスピキっぽい何かを招待する'
    },
    sheepspeaki: {
        name: 'ともだち（羊スピキ）',
        price: 1,
        desc: 'もこもこの羊毛をまとったスピキを招待する'
    },
    poemervivi: {
        name: 'ともだち（俳人ヴィヴィ）',
        price: 1,
        desc: '変わった格好をしたヴィヴィがやってくる'
    },
    hobagispeaki: {
        name: 'ともだち（ホバギスピキ）',
        price: 1,
        desc: '大好きなかぼちゃになりきったスピキを招待する'
    },
    autoReceive: {
        name: 'プレゼント自動回収',
        price: 1,
        desc: 'ｽﾋﾟｷが持ってきたプレゼントを自動で受け取ります'
    },
    growthStop: {
        name: 'ｽﾋﾟｷの成長停止',
        price: 1,
        desc: 'ｽﾋﾟｷが成長しなくなります<br>赤ちゃんは赤ちゃんのまま、子供は子供のままの姿を維持します'
    },
    // チャレンジモード用強化項目
    hungerDecay: {
        name: '空腹度減少の緩和',
        price: 1,
        desc: '減少速度を遅くします'
    },
    affectionDecay: {
        name: '好感度減少の緩和',
        price: 1,
        desc: '減少速度を遅くします'
    },
    cooldownReduction: {
        name: 'リロード時間短縮',
        price: 1,
        desc: 'ごはん系アイテム配置のリロード時間が短縮されます'
    }
};

/**
 * バイト(NPC呼出)定義 (JOBS)
 */
export const JOBS = {
    /*     CallAshur: {
            name: 'エシュール(モカロン屋さん)',
            imagefile: 'ashur_idle_1.png',
            size: 80,
            showInMenu: true,
            npcType: 'ashur'
        }, */
    CallPosher: {
        name: '給餌係 Pさん',
        imagefile: 'posher_idle_1.png',
        size: 150,
        showInMenu: true,
        npcType: 'posher'
    },
    CallUninse: {
        name: 'NPC ウニンセ',
        imagefile: 'uninse_idle_1.png',
        size: 100,
        showInMenu: true,
        npcType: 'uninse'
    },
    CallChickenSpeaki: {
        name: 'NPC トリスピキ',
        imagefile: 'chickenspeaki.png',
        size: 100,
        showInMenu: true,
        npcType: 'chickenspeaki'
    },
    CallSheepSpeaki: {
        name: 'NPC 羊スピキ',
        imagefile: 'sheepspeaki.png',
        size: 100,
        showInMenu: true,
        npcType: 'sheepspeaki'
    },
    CallPoemerVivi: {
        name: 'NPC 俳人ヴィヴィ',
        imagefile: 'poemervivi.png',
        size: 100,
        showInMenu: true,
        npcType: 'poemervivi'
    },
    CallHobagiSpeaki: {
        name: 'NPC ホバギスピキ',
        imagefile: 'hobagispeaki.png',
        size: 100,
        showInMenu: true,
        npcType: 'hobagispeaki'
    }
};
