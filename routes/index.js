const express = require('express');
const router = express.Router();
const crypto = require('crypto');
require('dotenv').config();

// 綠界提供的 SDK
const ecpay_payment = require('ecpay_aio_nodejs');

const { MERCHANTID, HASHKEY, HASHIV, HOST } = process.env;

// SDK 提供的範例，初始化
const options = {
  OperationMode: 'Test', // Test or Production
  MercProfile: {
    MerchantID: MERCHANTID,
    HashKey: HASHKEY,
    HashIV: HASHIV,
  },
  IgnorePayment: [
    "WebATM",
    "ATM",
    "CVS",
    "BARCODE",
    "AndroidPay"
  ],
  IsProjectContractor: false,
};

let TradeNo;

// 定期定額信用卡付款
router.get('/period', (req, res) => {
  const MerchantTradeDate = new Date().toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
  TradeNo = 'period' + new Date().getTime();
  
  let base_param = {
    MerchantTradeNo: TradeNo,
    MerchantTradeDate,
    TotalAmount: '50',
    TradeDesc: '定期定額測試交易',
    ItemName: '定期定額測試商品',
    ReturnURL: `${HOST}/return`,
    ClientBackURL: `${HOST}/clientReturn`,
  };

  let period_params = {
    PeriodAmount: '50',
    PeriodType: 'M', // M: 月，D: 天，Y: 年
    Frequency: '1', // 執行頻率
    ExecTimes: '2', // 總執行次數
    PeriodReturnURL: `${HOST}/return`,
  };
  
  const create = new ecpay_payment(options);
  const html = create.payment_client.aio_check_out_credit_period(period_params, base_param);
  console.log(html);

  res.render('index', {
    title: 'Express - 定期定額',
    html,
  });
});

// 後端接收綠界回傳的資料
router.post('/return', async (req, res) => {
  console.log('req.body:', req.body);
  
  const { CheckMacValue } = req.body;
  const data = { ...req.body };
  delete data.CheckMacValue;

  const create = new ecpay_payment(options);
  const checkValue = create.payment_client.helper.gen_chk_mac_value(data);

  console.log(
    '確認交易正確性：',
    CheckMacValue === checkValue,
    CheckMacValue,
    checkValue,
  );

  res.send('1|OK');
});

// 用戶交易完成後的轉址
router.get('/clientReturn', (req, res) => {
  console.log('clientReturn:', req.body, req.query);
  res.render('return', { query: req.query });
});

module.exports = router;
