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

    // スピキ同士のインタラクション(今後実装予定)
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
                    { imagefile: 'speaki_normal_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_normal_idle_2.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'none' },
                ],
                walking: [
                    { imagefile: 'speaki_normal_walking_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                ]
            },
            happy: {
                idle: [
                    { imagefile: 'speaki_happy_idle_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_3.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_4.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_5.png', soundfile: 'スピキ.mp3', text: 'ｽﾋﾟｷ!', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_idle_6.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ｽﾝﾊﾞｺｯﾁﾁｮﾜﾖｰ', movePattern: 'swing' },
                ],
                walking: [
                    { imagefile: 'speaki_happy_walking_1.png', soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_2.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_3.png', soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'swing' },
                    { imagefile: 'speaki_happy_walking_4.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
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
                    { imagefile: 'speaki_sad_idle_5.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'shake' }
                ],
                walking: [
                    { imagefile: 'speaki_sad_walking_1.png', soundfile: 'スピキヲイジメヌンデ.mp3', text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_2.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ', movePattern: 'shake' },
                    { imagefile: 'speaki_sad_walking_3.png', soundfile: '本場スピキ叩き.mp3', text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!', movePattern: 'none' }
                ]
            }
        },
        performance: {
            ITEM: {
                ToyPumpkin: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' }],
                Wimple: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3', text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ', movePattern: 'bounce' }],
                DeathWimple: [{ imagefile: 'speaki_sad_idle_5.png', soundfile: 'ひきつけ.mp3', text: 'ﾋｯｸ…ﾋｯｸ…', movePattern: 'shake' }],
                Candy: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'swing' }],
                Mocaron: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                AnimalCan: [{ imagefile: 'コミー.png', soundfile: 'これを食べて眠気を覚ますにゃん.mp3', text: 'これを食べて眠気を覚ますにゃん', movePattern: 'swing' }],
                Shionmelone: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                LeviDriver: [{ imagefile: 'speaki_sad_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱ!', movePattern: 'bounce' }],
                BrokenHobagi: [{ imagefile: 'speaki_sad_idle_3.png', soundfile: '慟哭.mp3', text: '慟哭', movePattern: 'shake' }],
                Poteto: [{ imagefile: 'speaki_item_poteto.png', soundfile: '本場スピキ撫で.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }],
                generic: [{ imagefile: 'speaki_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' }]
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
            }
        }
    },
    //赤ちゃんスピキ（画像素材が足りないため、normal、idleの画像を使い回している）
    baby: {
        mood: {
            normal: {
                idle: [
                    { imagefile: 'baby_normal_idle_1.png', soundfile: 'ピキ.mp3', text: 'ﾋﾟｷ!', movePattern: 'none' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: 'アーウ.mp3', text: 'ｱｰｳ…', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' },
                    { imagefile: 'baby_normal_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'bounce' }
                ],
                walking: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' }]
            },
            happy: {
                idle: [
                    { imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'none' },
                    { imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'bounce' },
                    { imagefile: 'baby_happy_idle_1.png', soundfile: '無音08.mp3', text: '……', movePattern: 'none' },
                    { imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ﾁｮﾜﾖ!', movePattern: 'shake' },
                ],
                walking: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ばぶぅ!', movePattern: 'bounce' }]
            },
            sad: {
                idle: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'アーウ.mp3', text: 'ふええ...', movePattern: 'shake' }],
                walking: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'ウアア.mp3', text: 'ｳｱｱｱｱﾝ!!', movePattern: 'shake' }]
            }
        },
        performance: {
            ITEM: {
                generic: [{ imagefile: 'baby_happy_idle_1.png', soundfile: 'チョワヨ.mp3', text: 'ばぶぅ', movePattern: 'bounce' }]
            },
            normal: {
                idle: [{ imagefile: 'baby_normal_idle_1.png', soundfile: 'スピキ.mp3', text: 'ばぶぅ', movePattern: 'bounce' }],
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
                place_item: [{ imagefile: 'posher_idle_1.png', soundfile: '給餌8秒.mp3', text: 'どーぞ！', movePattern: 'jump' }]
            }
        }
    }
};

/**
 * アイテム定義 (ITEMS)
 */
export const ITEMS = {
    //かぼちゃ
    ToyPumpkin: {
        name: ' ﾎﾊﾞｷﾞのおもちゃ',         //メニューに表示する名前
        imagefile: 'item_toypumpkin.png',  //使用する画像ファイル
        text: '',                       //配置時に表示するテキスト
        size: 180,                      //サイズ
        showInMenu: true,               //メニューに表示するか
        isFood: false,                  //食べ物かどうか
        friendshipChange: 10,           //友好度の変化量
        forcedEmotion: 'happy'          //反応したｽﾋﾟｷがどんな感情になるか(この感情は10秒持続する)
    },
    //ウィンプル
    Wimple: {
        name: 'ウィンプル',
        imagefile: 'item_wimple.png',
        text: '',
        size: 80,
        showInMenu: true,
        isFood: false,
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
        nutrition: 15,
        isFood: true,
        friendshipChange: 2,
        forcedEmotion: 'happy',
        reloadTime: 10000,     //配置してから次に配置できるようになるまでの時間
    },
    Mocaron: {
        name: 'モカロン',
        imagefile: 'item_モカロン.png',
        size: 100,
        text: '',
        showInMenu: false, // 初期は未解放なのでfalseにする
        nutrition: 25,
        isFood: true,
        friendshipChange: 5,
        forcedEmotion: 'happy',
        reloadTime: 20000,
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
        forcedEmotion: 'happy'
    },
    //----ランダムアイテム(プラスチックの数だけおけるやつ)----//
    //メニュー表示用のやつ
    RandomGift: {
        name: 'ランダムアイテム',
        imagefile: 'gift.png', // ギフト画像を使用
        size: 50,
        showInMenu: true,
        isRandomTool: true, // 内部的な識別用(これにしか使わない)
    },
    //ランダムアイテム
    AnimalCan: {
        name: 'アニマル缶',
        imagefile: 'item_アニマル缶.png',
        soundfile: 'コミーだってやるときはやるにゃん.mp3',
        size: 100,
        text: '',
        isSpecialGift: true,  //ランダムアイテムであることを示すもの
        showInMenu: false,
    },
    //ランダムアイテム
    Shionmelone: {
        name: 'シオン・ザ・メロンブレッド',
        imagefile: 'item_シオン・ザ・メロンブレッド.png',
        soundfile: 'シオン口上視線が泳いでいるぞ.mp3',
        size: 150,
        text: '元ネタ: https://youtu.be/Py06vYKp4EY?si=V2BOhdAMiVH_Rvh1',
        isSpecialGift: true,
        isFood: false,
        forcedEmotion: 'happy',
        showInMenu: false,
    },
    //ランダムアイテム
    LeviDriver: {
        name: 'レヴィ・ドライバー',
        imagefile: 'item_レヴィドライバー.png',
        soundfile: 'レヴィドライバー.mp3',
        size: 100,
        text: '元ネタ: https://youtu.be/WsQKUin6sb0?si=lltZElvtIdY4qbA6',
        isSpecialGift: true,
        isFood: false,
        showInMenu: false,
    },
    //ランダムアイテム
    BrokenHobagi: {
        name: 'かぼちゃ粥',
        imagefile: 'item_かぼちゃ粥.png',
        size: 100,
        isSpecialGift: true,
        isFood: false,
        forcedEmotion: 'sad',
        showInMenu: false,
    },
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
    }
};
