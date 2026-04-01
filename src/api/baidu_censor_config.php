<?php
/**
 * 百度内容审核配置
 * 请在下方填写您的百度智能云API密钥
 */

return [
    // 是否启用百度内容审核
    'enabled' => true,

    // 百度智能云API密钥
    'api_key' => '',
    'secret_key' => '', 

    // 审核接口地址
    'api_url' => 'https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined',

    // Token获取地址
    'token_url' => 'https://aip.baidubce.com/oauth/2.0/token',

    // 审核类型配置
    'check_types' => [
        'porn' => true,           // 色情识别
        'terror' => true,         // 暴恐识别
        'politician' => true,     // 公众人物识别
        'disgust' => true,        // 恶心图像识别
        'ad' => true,             // 广告检测
        'watermark' => true,      // 水印检测
        'quality' => true,        // 图像质量检测
        'face' => false,          // 用户头像审核
    ],

    // 审核阈值 (0-1, 越高越严格)
    'threshold' => 0.6,

    // 是否拒绝违规图片
    'reject_violation' => true,

    // Token缓存时间(秒)
    'token_cache_time' => 3600,
];
