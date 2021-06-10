/*
动物联萌 618活动
更新时间：2021-06-10 09:13
做任务，收金币
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#动物联萌
5 * * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js, tag=动物联萌, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jd.png, enabled=true
// Loon
[Script]
cron "5 * * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js,tag=动物联萌
// Surge
动物联萌 = type=cron,cronexp=5 * * * *,wake-system=1,timeout=500,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js
*/
const $ = new Env('动物联萌');
//Node.js用户请在jdCookie.js处填写京东ck;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '',secretp = '',shareCodeList = [],showCode = true;
let doPkSkill = true;  //自动放技能，不需要的改为false
const JD_API_HOST = `https://api.m.jd.com/client.action?functionId=`;
!(async () => {
  await requireConfig()
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      if (i) console.log(`\n***************开始京东账号${i + 1}***************`)
      initial();
      await  QueryJDUserInfo(i);
      if (!merge.enabled)  //cookie不可用
      {
        $.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        $.msg($.name, `【提示】京东账号${i ? i + 1 : "" } cookie已过期！请先获取cookie\n直接使用NobyDa的京东签到获取`, 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
        continue;
      }
      console.log('\n\n京东账号：'+merge.nickname + ' 任务开始')
      await zoo_sign()
      await zoo_pk_getHomeData();
      await zoo_getHomeData();
      if (merge.black) continue;
      //await qryCompositeMaterials()
      await msgShow();
      //break;
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())

//获取昵称（直接用，勿删）
function QueryJDUserInfo(i,timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
        headers : {
          'Referer' : `https://wqs.jd.com/my/iserinfo.html`,
          'Cookie' : cookie
        }
      }
      $.get(url, (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.retcode === 13) {
            merge.enabled = false
            return
          } else if (data.retcode === 0) {
            merge.nickname = data.base.nickname;
          } else {
            merge.nickname = `账号${i + 1}`
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function zoo_getTaskDetail(shopSign = "",appSign = "",timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      appSign = appSign&&'"appSign":"2","channel":1,'
      let url = {
        url : `${JD_API_HOST}zoo_getTaskDetail`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getTaskDetail&body={${appSign}"shopSign":"${shopSign}"}&client=wh5&clientVersion=1.0.0`
      }
      //if (shopSign) {
      //  console.log(shopSign)
      //  url.url = url.url.replace('zoo_getTaskDetail','zoo_shopLotteryInfo')
      //  url.body = url.body.replace('zoo_getTaskDetail','zoo_shopLotteryInfo')
      //}
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('zoo_getTaskDetail:' + data)
          data = JSON.parse(data);
          if (shopSign === "") {
            shopSign = '""'
            if (appSign === "" && typeof data.data.result.inviteId !== "undefined") console.log(`您的个人助力码：${data.data.result.inviteId}`)
          }
          if (!data.data.result) return
          for (let i = 0;i < data.data.result.taskVos.length;i ++) {
            //if (merge.black)  return ;
            console.log( "\n" + data.data.result.taskVos[i].taskType + '-' + data.data.result.taskVos[i].taskName + (appSign&&"（小程序）") + '-'  +  (data.data.result.taskVos[i].status === 1 ? `已完成${data.data.result.taskVos[i].times}-未完成${data.data.result.taskVos[i].maxTimes}` : "全部已完成")  )
            if ([1,2,3,5,7,9,26].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1 ) {
              let list = data.data.result.taskVos[i].productInfoVos||data.data.result.taskVos[i].brandMemberVos||data.data.result.taskVos[i].followShopVo||data.data.result.taskVos[i].shoppingActivityVos||data.data.result.taskVos[i].browseShopVo
              //console.log(list)
              //if (data.data.result.taskVos[i].taskType === 9) continue
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                for (let j in list) {
                  if (list[j].status === 1) {
                    //let taskBody = `functionId=zoo_collectScore&body={"taskId":"${data.data.result.taskVos[i].taskId}","actionType":1,"taskToken":"${list[j].taskToken}","ss":"{\\"extraData\\":{\\"log\\":\\"${sign}\\",\\"sceneid\\":\\"DR216hPageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}"}&client=wh5&clientVersion=1.0.0`
                    let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": data.data.result.taskVos[i].taskId,"actionType":1,"taskToken" : list[j].taskToken,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
                    console.log("\n"+(list[j].title||list[j].shopName||list[j].skuName))
                    await zoo_collectScore(taskBody,2000)
                    //}
                    list[j].status = 2;
                    break;
                  } else {
                    continue;
                  }
                }
              }
            }

            if ([12,13].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1) {
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": data.data.result.taskVos[i].taskId,"taskToken" : list[j].taskToken,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
                if (merge.black)  return ;
                  //if (typeof data.data.result.taskVos[i].simpleRecordInfoVo !== "undefined"){
                  //  taskBody = encodeURIComponent(`{"dataSource":"newshortAward","method":"getTaskAward","reqParams":"{\\"taskToken\\":\\"${data.data.result.taskVos[i].simpleRecordInfoVo.taskToken}\\"}","sdkVersion":"1.0.0","clientLanguage":"zh"}`)
                  //  await qryViewkitCallbackResult(taskBody,1000)
                  //} else {
                await zoo_collectScore(taskBody,1000)
                  //}
                }
            }

            if ([2].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1 && !data.data.result.taskVos[i].taskName.includes("逛逛")) {
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                await zoo_getFeedDetail(data.data.result.taskVos[i].taskId)
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//获取我的城市
function zoo_myMap(timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_myMap`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_myMap&body={"ss":"{\\"extraData\\":{},\\"businessData\\":{},\\"secretp\\":\\"${secretp}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log('zoo_myMap:' + data)
          data = JSON.parse(data);
          for (let i in data.data.result.shopList) {
            // (data.data.result.shopList[i].status === 1) {
              //console.log(data.data.result.shopList[i])
            console.log('\n开始小镇任务：'+ data.data.result.shopList[i].name)// + '-' + data.data.result.shopList[i].shopId
            await zoo_getTaskDetail(data.data.result.shopList[i].shopId)
            //}
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//发技能
function zoo_pk_doPkSkill(skillType, timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_doPkSkill`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_pk_doPkSkill&body={"skillType" : "${skillType}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('zoo_pk_doPkSkill:' + data)
          data = JSON.parse(data);
          if (data.data.bizCode === 0) {
            console.log('技能获得：' + data.data.result.skillValue);
          } else {
            console.log('技能释放失败：' + data.data.bizMsg);
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//签到
function zoo_sign(timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_sign`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_sign&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('签到结果：' + data.data.bizMsg);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//逛商城
function zoo_shopSignInWrite(shopSign,timeout = 0){
  return new Promise((resolve) => {

    let rnd = Math.round(Math.random()*1e6)
    let nonstr = randomWord(false,10)
    let time = Date.now()
    let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
    let msg = `inviteId=-1&rnd=${rnd}&stealId=-1&taskId=${shopSign}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=1`
    let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase()

    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_shopSignInWrite`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_shopSignInWrite&body={"shopSign":"${shopSign}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.1.3\\",\\"sceneid\\":\\"QD216hPageh5\\"},\\"businessData\\":{\\"taskId\\":\\"${shopSign}\\",\\"rnd\\":\\"${rnd}\\",\\"inviteId\\":\\"-1\\",\\"stealId\\":\\"-1\\"},\\"secretp\\":\\"${secretp}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          if (data.data.bizCode !== 0) {
            console.log(data.data.bizMsg)
            merge.end = true
          } else {
            console.log('获得金币' + data.data.result.score)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//逛商城
function zoo_shopSignInRead(shopSign,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_shopSignInRead`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_shopSignInRead&client=wh5&clientVersion=1.0.0&body={"shopSign":"${shopSign}"}`
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          data = JSON.parse(data);
          if (data.data.result.signInTag === 0) {
             secretp = secretp||data.data.result.secretp
             await zoo_shopSignInWrite(shopSign)
          } else {
            console.log('已逛过')
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//收金币
function zoo_collectProduceScore(timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_collectProduceScore`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Content-Type' : `application/x-www-form-urlencoded`
        },
        body : `functionId=zoo_collectProduceScore&body=${JSON.stringify({"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          if (data.data.bizCode === -1002) {
            console.log('此账号暂不可使用脚本，脚本终止！')
            merge.black = true;
            return ;
          }
          if (data.data.result) console.log(`\n收取金币：${data.data.result.produceScore}`)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务
function zoo_collectScore(taskBody,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_collectScore`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : taskBody
        }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('任务执行结果：' + data.data.bizMsg)
          if (data.data.bizCode === -1002) {
            //console.log(url.body)
            //console.log('\n提示火爆，休息5秒')
            //await $.wait(5000)
            //await zoo_collectScore(taskBody)
            console.log('此账号暂不可使用脚本，脚本终止！')
            merge.black = true;
            return ;
          }
          if (data.data.bizCode === 0 && typeof data.data.result.taskToken !== "undefined") {
            //console.log('需要再次执行,如提示活动异常请多次重试，个别任务多次执行也不行就去APP做吧！')
            let taskBody = encodeURIComponent(`{"dataSource":"newshortAward","method":"getTaskAward","reqParams":"{\\"taskToken\\":\\"${data.data.result.taskToken}\\"}","sdkVersion":"1.0.0","clientLanguage":"zh"}`)
            //console.log(taskBody)
            await qryViewkitCallbackResult(taskBody,7000)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务
function zoo_doAdditionalTask(taskBody,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_doAdditionalTask`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : taskBody
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          data = JSON.parse(data);
          console.log('任务执行结果：' + data.data.bizMsg)
          if (data.data.bizCode === -1002) {
            console.log('\n提示火爆，休息5秒')
            await $.wait(5000)
            return ;
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//查询甄选任务
function zoo_getFeedDetail(taskId,timeout = 0){
  return new Promise((resolve) => {

    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_getFeedDetail`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getFeedDetail&body={"taskId":"${taskId}"}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          let list =  data.data.result.viewProductVos||data.data.result.addProductVos
          for (let i in list) {
            if (list[i].status === 1) {
              for (let j in list[i].productInfoVos) {
                if (j >= 5)  break;
                //${JSON.stringify({"ss" : getBody()})}
                //let taskBody = `functionId=zoo_collectScore&body={"taskId":${list[i].taskId},"taskToken" : "${list[i].productInfoVos[j].taskToken}","ss":"{\\"extraData\\":{\\"log\\":\\"${sign}\\",\\"sceneid\\":\\"QD216hPageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","actionType":1}&client=wh5&clientVersion=1.0.0`
                let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": list[i].taskId,"actionType":1,"taskToken" : list[i].productInfoVos[j].taskToken,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
                //console.log(taskBody)
                console.log(list[i].productInfoVos[j].skuName)
                await zoo_collectScore(taskBody,1000)
              }
              list[i].status = 2
            }
          }

        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务2
function qryViewkitCallbackResult(taskBody,timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `https://api.m.jd.com/?functionId=qryViewkitCallbackResult&client=wh5&clientVersion=1.0.0&body=${taskBody}&_timestamp=`+Date.now(),
        headers : {
          'Origin' : `https://bunearth.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `*/*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Referer' : 'https://bunearth.m.jd.com/babelDiy/Zeus/4SJUHwGdUQYgg94PFzjZZbGZRjDd/index.html?jmddToSmartEntry=login'
        }
       }

      $.get(url, async (err, resp, data) => {
        try {
          //console.log(url.url)
          //console.log(data)
          data = JSON.parse(data);
          console.log(data.toast.subTitle)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//群组助力
function zoo_pk_assistGroup(inviteId = "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_assistGroup`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.6;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Refer' : `https://bunearth.m.jd.com/babelDiy/Zeus/4SJUHwGdUQYgg94PFzjZZbGZRjDd/index.html?jmddToSmartEntry=login`
        },
        body : `functionId=zoo_pk_assistGroup&body=${JSON.stringify({"confirmFlag": 1,"inviteId" : inviteId,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('商圈助力：' + data)
          data = JSON.parse(data);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//获取首页信息
function zoo_getHomeData(inviteId= "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_getHomeData`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getHomeData&body={${inviteId ? "\"inviteId\":\"" + inviteId +'\"': ""}}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          //if (merge.black)  return ;
          data = JSON.parse(data);
          if (data.code === 0) {
            if (inviteId !== "") {
              let taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({"taskId": 2,"inviteId":inviteId,"actionType":1,"ss" : getBody()})}&client=wh5&clientVersion=1.0.0`
              await zoo_collectScore(taskBody, 1000)
              return
            }
            //console.log('zoo_getHomeData:' + JSON.stringify(data))
            secretp = data.data.result.homeMainInfo.secretp
            await zoo_collectProduceScore();
            if (merge.black) return;
            await zoo_pk_getHomeData('sSKNX-MpqKOJsNu_mZneBluwe_DRzs1f90l6Q_p8OVxtoB-JJEErrVU4eHW7e2I')
            //await zoo_pk_assistGroup()
            //if (data.data.result.homeMainInfo.raiseInfo.buttonStatus === 1 )
            if (parseInt(data.data.result.homeMainInfo.raiseInfo.totalScore) >= parseInt(data.data.result.homeMainInfo.raiseInfo.nextLevelScore) ) await zoo_raise(1000)
            await zoo_getHomeData('ZXTKT0225KkcRx4b8lbWJU72wvZZcwFjRWn6-7zx55awQ');//ZXTKT0225KkcRBka_FPTJBjzkv9YfAFjRWn6-7zx55awQ
            await zoo_getTaskDetail()
            await zoo_getTaskDetail("","app")
          } else {
            return
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function zoo_raise(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_raise`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_raise&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('解锁结果：'+ (data.data.bizCode||'成功'))
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function qryCompositeMaterials(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}qryCompositeMaterials`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=qryCompositeMaterials&body={"qryParam":"[{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"viewLogo\\",\\"id\\":\\"05149412\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"bottomLogo\\",\\"id\\":\\"05149413\\"}]","activityId":"2cKMj86srRdhgWcKonfExzK4ZMBy","pageId":"","reqSrc":"","applyKey":"21beast"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          for (let i in data.data.viewLogo.list) {
            await zoo_getTaskDetail(data.data.viewLogo.list[i].desc)
          }
          for (let i in data.data.bottomLogo.list) {
            await zoo_getTaskDetail(data.data.bottomLogo.list[i].desc)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function zoo_pk_getHomeData(inviteId = "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_getHomeData`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_pk_getHomeData&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          if (inviteId !== "") {
            await $.getScript("https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/memo/jd_nianBeastShareCode.txt").then((text) => (shareCodeList = text ? text.split('\n') : []))
            for (let i in shareCodeList) {
              if (shareCodeList[i]) await zoo_pk_assistGroup(shareCodeList[i]);
            }
            //await zoo_pk_assistGroup(inviteId);
          } else {
            //console.log(data);
            data = JSON.parse(data);
            if (showCode) {
              console.log('您的队伍助力码：' + data.data.result.groupInfo.groupAssistInviteId);
              showCode = false;
            }
            if (!doPkSkill) return ;
            if (typeof data.data.result.groupPkInfo.dayTotalValue !== "undefined") {
              if (parseInt(data.data.result.groupPkInfo.dayTotalValue) >= parseInt(data.data.result.groupPkInfo.dayTargetSell)) return;
            }
            else
            if (typeof data.data.result.groupPkInfo.nightTotalValue !== "undefined") {
              if (parseInt(data.data.result.groupPkInfo.nightTotalValue) >= parseInt(data.data.result.groupPkInfo.nightTargetSell)) return;
            }
            else
              return;
            let list = data.data.result.groupInfo.skillList;
            for (let i = list.length -1; i>=0; i--) {
              if (parseInt(list[i].num) > 0) {
                await zoo_pk_doPkSkill(list[i].code,800);
                await zoo_pk_getHomeData();
                break;
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function requireConfig() {
  return new Promise(resolve => {
    //Node.js用户请在jdCookie.js处填写京东ck;
    const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
    //IOS等用户直接用NobyDa的jd cookie
    if ($.isNode()) {
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          cookiesArr.push(jdCookieNode[item])
        }
      })
    } else {
      let cookiesData = $.getdata('CookiesJD') || "[]";
      cookiesData = jsonParse(cookiesData);
      cookiesArr = cookiesData.map(item => item.cookie);
      cookiesArr.reverse();
      cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
      cookiesArr.reverse();
      cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    resolve()
  })
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
//初始化
function initial() {
  merge = {
    nickname: "",
    enabled: true,
    end: false,
    black: false
  }
  for (let i in merge) {
    merge[i].success = 0;
    merge[i].fail = 0;
    merge[i].prizeCount = 0;
    merge[i].notify = "";
    merge[i].show = true;
  }
  showCode = true;
}
//通知
function msgShow() {
  console.log("\n\n京东账号："+merge.nickname + ' 任务已做完！\n如有未完成的任务，请多执行几次')
 //$.msg($.Name,"","京东账号："+merge.nickname + ' 任务已做完！\n如有未完成的任务，请多执行几次')
}
var _0xodI='jsjiami.com.v6',_0x550c=[_0xodI,'LcKnwodSGg==','DsKZwoXChMKW','UcKwwqchwpg=','aMKtQcKHOg==','TGnCpsKKw4Q=','UA41LmE=','wqnDrsOMwrvDuQ==','woDCmMOewoUEYMO3NcOJ','WQdcZcKrwpvCung=','YcKYwoJYJQ==','McKrwrjCvcKA','K8K5wr9FIQ==','w53ChxZwbA==','a8KJwopELQ==','HQ/DpyAVw7g=','dsOkw5PCt2I=','EcKzwqjCssKN','XsKGdMK6MQ==','wpjDg28swrk=','IsO2Y8OTw50=','w6vDl8OZwpY7','QRllV8Ks','Qj3DqsOiw6c=','FQTDojQ2','RhJkXsKb','WEDCsMKPw4Q=','fsOkwp3DoMOv','w4jDr0tcBhc=','S03CnsKWw5s=','woHCg8OZwoIO','BVjCrcOmw48=','w63Dp0dLPA==','JB/DuBoMwrQ=','WcK7wotbKg==','UCzDiFcz','w4UhwqQxw7g=','wpkawo7DvcO6','BMOOw4IHw7k=','NsOCw6Ihw4Q=','UcKYw41qwpg=','wrlgd2Qt','w4Vcw6IAwr4=','JsK8w7AQwpo=','woHDjz55Qw==','w5/CkUfCssKA','wonDusKnMyslW8K2wqPCrcKpw5A=','wpzDi8KmORI=','w79EwqHCtcKWPMOGw6jCnToEwpI=','wqLDqcKONC0=','wobCqcOawrwwdnvDgcKlw7xkw7w=','a8KIw4ASPg==','w6vCrw9jdQ==','VMKrwoTCtMKD','worDiTR6Zw==','IMONw6c2w7xa','wopmUFg7','AMKjw6cMwpw=','ScKHwqUowo0=','GzDDgsKRwoNP','w6Qlwow8w4nCjQ==','QQ1hdsKtwpo=','w6nDs8O1wqcqeQ==','woLDqcKw','N8Kiw5ItwoI=','w5vDrFY=','N8K1wpVcOw==','X8Kow61MwoM=','w7lZw7QowrA=','OknCqsOiw79z','S8Kww4EaNQ==','HSDDpyIF','PUbCpcOsw5s=','SMKEwrklwow=','TcK5w7c5DGo=','w7jCtVrCgMKtUw==','C8OFwrvDsXfDkk8g','RTvDoMOjw7PCnAPDlB7Cpg==','QzDDnHQswovCqMKO','GMKNw6I0','TjLDssOew4fCnTfDgzDCosKMCCvCiQ==','TxpTTg==','cg7DmcKTwqw=','SjbDr8O2w4TCmw==','woPCmcOfwoQ=','wrDDuAlwcg==','FcO0GQ1e','KTnDgRwx','wqVHXHcWwpQ=','VibDssO5','wrXDgX9ULw==','WjwDMg==','N8K7wrxvOw==','YMKtwrZmNw==','UcO4w4LCrA==','TsO4wpXDscOoPsKpw6TDjwk=','wqtUJMKhDA==','BTTDgsKSwphK','wpzDkUZlGQ==','PcKFw6Y2wpI=','WsK4wqEewoQ=','WTHDtMKIwq8=','wrrDo8OawqfCm8OOHMKKw5jDpMOzwpY=','MDjDnAoz','QwdVTcKrTifDhBPDo3zDhw==','wrYtwp7DusOX','wo7Dr8OTwq7DocK7NA==','YcKDwoTCgsKD','FcOFEw9yPh3Ds8O5DQ==','M8O5wqXDp3U=','US3DoG0dworCp8KbPMOaEcOf','CBPDhsKnwpk=','YMKWwpPCmMKG','wp7DpsOmwqzDjw==','Cz3DqcKbwqM=','QMK2wp7Ct8KkPCPDq8KbKWoD','w5Fnw4I0wrBzwqMnwpLCgsKow4M=','QMOXwr3DlMOq','SVPCocKJ','TzEgFlg=','wr8rwrnDlsOIAA==','dXXCn8KDw5w=','C8OwbsObw7zDscOdw400wr0=','woPCusOFwqk/','ZcOpwpbDjMOc','D8O8woHDgFA=','F8Kjw5kiwoQ=','QwrDusK4wqY=','w5/CmwVBSVgQw7Nlw6QCSio9w65zw7kPw7NdRcKjwpkDwrvCiHzChHzDpzbDphzClsOjwo5mwp7Dm8Kdwq3Cm8OaEMOxIgRtwoXDvcKzZcOmw4cpN8KLXsOKwpc0w7gOwo/DiMKoEGPCucKtwqBZEn1zDjBOScKLwrnCgxHDjsOtw7PCoMOqw7Axw4XCpBgXw7TDl0o6w4HCiMOfwr8pS8OaS2/DgMKlXQ==','wrdhTA==','asKsw6J3w5/Cim8+wqnCscKBCQ==','f8K3w7NnwpM=','CgrDpycZ','OhvDuBkXwrE=','wqdaGsK6Jg==','WMKfwrF3NQ==','wpLDoF0JwrI=','cFjCq8Ouw651w4g=','w5vDqTVxcks=','GArDhGDCoA==','WcKZw6spIQ==','HmnClcOMw74=','BQXDnDcRw7XCqMOiC0Vg','T8KHwoMywpvCi1E4','w4Ymwqk0w48=','wr3Dn08Mwok=','KjesjiXamKi.com.v6AOHytIJpP=='];(function(_0x7d64a0,_0x16835b,_0x174d8c){var _0x3b8205=function(_0x36a3a1,_0x5a43b8,_0x470deb,_0x5cea07,_0x293e60){_0x5a43b8=_0x5a43b8>>0x8,_0x293e60='po';var _0x3feb5a='shift',_0x1f41b0='push';if(_0x5a43b8<_0x36a3a1){while(--_0x36a3a1){_0x5cea07=_0x7d64a0[_0x3feb5a]();if(_0x5a43b8===_0x36a3a1){_0x5a43b8=_0x5cea07;_0x470deb=_0x7d64a0[_0x293e60+'p']();}else if(_0x5a43b8&&_0x470deb['replace'](/[KeXKAOHytIJpP=]/g,'')===_0x5a43b8){_0x7d64a0[_0x1f41b0](_0x5cea07);}}_0x7d64a0[_0x1f41b0](_0x7d64a0[_0x3feb5a]());}return 0x8df79;};return _0x3b8205(++_0x16835b,_0x174d8c)>>_0x16835b^_0x174d8c;}(_0x550c,0x1e6,0x1e600));var _0x56ae=function(_0x3ae632,_0x505cf5){_0x3ae632=~~'0x'['concat'](_0x3ae632);var _0x32a3f3=_0x550c[_0x3ae632];if(_0x56ae['bwTwxB']===undefined){(function(){var _0x3fe130=function(){var _0x5813e7;try{_0x5813e7=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x37ef1c){_0x5813e7=window;}return _0x5813e7;};var _0x14fb8a=_0x3fe130();var _0x3ee621='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x14fb8a['atob']||(_0x14fb8a['atob']=function(_0x3a0fad){var _0x35db63=String(_0x3a0fad)['replace'](/=+$/,'');for(var _0x5e8709=0x0,_0x46500f,_0x455673,_0x213744=0x0,_0x578a38='';_0x455673=_0x35db63['charAt'](_0x213744++);~_0x455673&&(_0x46500f=_0x5e8709%0x4?_0x46500f*0x40+_0x455673:_0x455673,_0x5e8709++%0x4)?_0x578a38+=String['fromCharCode'](0xff&_0x46500f>>(-0x2*_0x5e8709&0x6)):0x0){_0x455673=_0x3ee621['indexOf'](_0x455673);}return _0x578a38;});}());var _0x5c23a0=function(_0x30edc5,_0x505cf5){var _0x11b45d=[],_0x317350=0x0,_0x41309c,_0x44b1a6='',_0x27f007='';_0x30edc5=atob(_0x30edc5);for(var _0x56dd39=0x0,_0x19aa26=_0x30edc5['length'];_0x56dd39<_0x19aa26;_0x56dd39++){_0x27f007+='%'+('00'+_0x30edc5['charCodeAt'](_0x56dd39)['toString'](0x10))['slice'](-0x2);}_0x30edc5=decodeURIComponent(_0x27f007);for(var _0x4c40c1=0x0;_0x4c40c1<0x100;_0x4c40c1++){_0x11b45d[_0x4c40c1]=_0x4c40c1;}for(_0x4c40c1=0x0;_0x4c40c1<0x100;_0x4c40c1++){_0x317350=(_0x317350+_0x11b45d[_0x4c40c1]+_0x505cf5['charCodeAt'](_0x4c40c1%_0x505cf5['length']))%0x100;_0x41309c=_0x11b45d[_0x4c40c1];_0x11b45d[_0x4c40c1]=_0x11b45d[_0x317350];_0x11b45d[_0x317350]=_0x41309c;}_0x4c40c1=0x0;_0x317350=0x0;for(var _0xfa58c8=0x0;_0xfa58c8<_0x30edc5['length'];_0xfa58c8++){_0x4c40c1=(_0x4c40c1+0x1)%0x100;_0x317350=(_0x317350+_0x11b45d[_0x4c40c1])%0x100;_0x41309c=_0x11b45d[_0x4c40c1];_0x11b45d[_0x4c40c1]=_0x11b45d[_0x317350];_0x11b45d[_0x317350]=_0x41309c;_0x44b1a6+=String['fromCharCode'](_0x30edc5['charCodeAt'](_0xfa58c8)^_0x11b45d[(_0x11b45d[_0x4c40c1]+_0x11b45d[_0x317350])%0x100]);}return _0x44b1a6;};_0x56ae['yCKHCr']=_0x5c23a0;_0x56ae['fIqBid']={};_0x56ae['bwTwxB']=!![];}var _0x57f60b=_0x56ae['fIqBid'][_0x3ae632];if(_0x57f60b===undefined){if(_0x56ae['QqoXUY']===undefined){_0x56ae['QqoXUY']=!![];}_0x32a3f3=_0x56ae['yCKHCr'](_0x32a3f3,_0x505cf5);_0x56ae['fIqBid'][_0x3ae632]=_0x32a3f3;}else{_0x32a3f3=_0x57f60b;}return _0x32a3f3;};function randomWord(_0x193e3b,_0x5ac14c,_0x36e428){var _0x538bad={'ypLIo':function(_0x12984a,_0x5799a6){return _0x12984a+_0x5799a6;},'wThfp':function(_0x46b11b,_0xb76c50){return _0x46b11b*_0xb76c50;},'CDbHY':function(_0x595a5e,_0x1fe77c){return _0x595a5e-_0x1fe77c;},'Uhtfw':function(_0x3ee03d,_0x10bb8e){return _0x3ee03d<_0x10bb8e;}};let _0x4524b8='',_0xb0fb60=_0x5ac14c,_0xfb1dec=['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];if(_0x193e3b){_0xb0fb60=_0x538bad[_0x56ae('0','L1Dy')](Math[_0x56ae('1','XK#n')](_0x538bad[_0x56ae('2',')JK2')](Math[_0x56ae('3','Rr3K')](),_0x538bad[_0x56ae('4','QBwz')](_0x36e428,_0x5ac14c))),_0x5ac14c);}for(let _0xd886e5=0x0;_0x538bad[_0x56ae('5','1680')](_0xd886e5,_0xb0fb60);_0xd886e5++){pos=Math[_0x56ae('6','pE5E')](Math[_0x56ae('7','&aBJ')]()*(_0xfb1dec[_0x56ae('8','hC@1')]-0x1));_0x4524b8+=_0xfb1dec[pos];}return _0x4524b8;}function minusByByte(_0x19732c,_0x290645){var _0x130947={'biAGi':function(_0x3e31dc,_0x2efc65){return _0x3e31dc(_0x2efc65);},'bdZKt':function(_0x515f8f,_0x20ebd0){return _0x515f8f<_0x20ebd0;},'TtYaS':function(_0x2d55e3,_0x1f88ef){return _0x2d55e3-_0x1f88ef;}};var _0x5c6e53=_0x19732c[_0x56ae('9','@qzf')],_0x652aa7=_0x290645[_0x56ae('a','HcbZ')],_0x1956f6=Math[_0x56ae('b','ym8L')](_0x5c6e53,_0x652aa7),_0x154e8e=toAscii(_0x19732c),_0x14c35f=_0x130947[_0x56ae('c','1680')](toAscii,_0x290645),_0x56f175='',_0x2e23a2=0x0;for(_0x5c6e53!==_0x652aa7&&(_0x154e8e=add0(_0x154e8e,_0x1956f6),_0x14c35f=this['add0'](_0x14c35f,_0x1956f6));_0x130947['bdZKt'](_0x2e23a2,_0x1956f6);)_0x56f175+=Math[_0x56ae('d','qRY%')](_0x130947[_0x56ae('e','w6RM')](_0x154e8e[_0x2e23a2],_0x14c35f[_0x2e23a2])),_0x2e23a2++;return _0x56f175;}function getKey(_0x8c1ac4,_0x433b5d){var _0x15df71={'kjaiP':function(_0x27ee0b,_0x415e87){return _0x27ee0b+_0x415e87;},'XWFKF':function(_0x84117,_0x323506){return _0x84117(_0x323506);},'NLYqC':function(_0x117a36,_0x347629){return _0x117a36<_0x347629;},'jlXDM':function(_0x30c231,_0x4f5ebd){return _0x30c231!==_0x4f5ebd;},'lJned':_0x56ae('f','4Qx*'),'YtGjC':function(_0x4e146d,_0x564aba){return _0x4e146d>=_0x564aba;},'MJyxJ':function(_0x5c1444,_0x3e1bf6){return _0x5c1444^_0x3e1bf6;}};let _0x51ec16=[],_0x3d2007,_0xe81ac2=0x0;for(let _0x2e3df6=0x0;_0x15df71[_0x56ae('10','(j5&')](_0x2e3df6,_0x8c1ac4['toString']()[_0x56ae('11','02D[')]);_0x2e3df6++){if(_0x15df71[_0x56ae('12','hRJ3')](_0x15df71['lJned'],_0x15df71[_0x56ae('13','21sc')])){return _0x15df71[_0x56ae('14','02D[')](_0x15df71['XWFKF'](Array,n)['join']('0'),t)[_0x56ae('15','pE5E')](-n);}else{_0xe81ac2=_0x2e3df6;if(_0x15df71['YtGjC'](_0xe81ac2,_0x433b5d[_0x56ae('16','hRJ3')]))_0xe81ac2-=_0x433b5d[_0x56ae('17','iU6i')];_0x3d2007=_0x15df71['MJyxJ'](_0x8c1ac4[_0x56ae('18','52qr')]()[_0x56ae('19','sff*')](_0x2e3df6),_0x433b5d['charCodeAt'](_0xe81ac2));_0x51ec16['push'](_0x3d2007%0xa);}}return _0x51ec16[_0x56ae('1a','A#U9')]()['replace'](/,/g,'');}function toAscii(_0x419d9e){var _0x257b65={'TqowP':function(_0x42d776,_0x583347){return _0x42d776(_0x583347);}};var _0x571931='';for(var _0x18010e in _0x419d9e){var _0x320837=_0x419d9e[_0x18010e],_0xf10a48=/[a-zA-Z]/[_0x56ae('1b','qj(q')](_0x320837);if(_0x419d9e[_0x56ae('1c','sff*')](_0x18010e))if(_0xf10a48)_0x571931+=_0x257b65['TqowP'](getLastAscii,_0x320837);else _0x571931+=_0x320837;}return _0x571931;}function add0(_0x5ecd61,_0x546742){return(Array(_0x546742)[_0x56ae('1d','%hPT')]('0')+_0x5ecd61)[_0x56ae('1e','0OdQ')](-_0x546742);}function getLastAscii(_0x3229c1){var _0x1a2ea6=_0x3229c1['charCodeAt'](0x0)['toString']();return _0x1a2ea6[_0x1a2ea6['length']-0x1];}function wordsToBytes(_0x3aa901){var _0xb3e9cb={'ogjLK':function(_0x34b05f,_0x21fcaa){return _0x34b05f<_0x21fcaa;},'Rjkhi':function(_0x1c3b0e,_0x1966dd){return _0x1c3b0e*_0x1966dd;},'MeUle':function(_0x589ff5,_0x4d00d6){return _0x589ff5>>>_0x4d00d6;},'cYkpo':function(_0x195da1,_0xf9b2d3){return _0x195da1-_0xf9b2d3;},'aCWaI':function(_0x4efad7,_0x539f84){return _0x4efad7%_0x539f84;}};for(var _0x5df28a=[],_0x49c9f7=0x0;_0xb3e9cb['ogjLK'](_0x49c9f7,_0xb3e9cb['Rjkhi'](0x20,_0x3aa901[_0x56ae('1f','sff*')]));_0x49c9f7+=0x8)_0x5df28a[_0x56ae('20','a7k1')](_0x3aa901[_0xb3e9cb[_0x56ae('21',')JK2')](_0x49c9f7,0x5)]>>>_0xb3e9cb[_0x56ae('22','yn)*')](0x18,_0xb3e9cb[_0x56ae('23','3T!V')](_0x49c9f7,0x20))&0xff);return _0x5df28a;}function bytesToHex(_0x2866e7){var _0x13e8bd={'YxmTX':function(_0x221fe4,_0x23cd5a){return _0x221fe4>>>_0x23cd5a;},'TzpRS':function(_0xf9e3d4,_0x3d2589){return _0xf9e3d4&_0x3d2589;}};for(var _0x2a1919=[],_0x4449f5=0x0;_0x4449f5<_0x2866e7[_0x56ae('24','QBwz')];_0x4449f5++)_0x2a1919[_0x56ae('25','sff*')](_0x13e8bd[_0x56ae('26','x[[m')](_0x2866e7[_0x4449f5],0x4)['toString'](0x10)),_0x2a1919[_0x56ae('27','Nh#v')](_0x13e8bd[_0x56ae('28','w6RM')](0xf,_0x2866e7[_0x4449f5])['toString'](0x10));return _0x2a1919['join']('');}function stringToBytes(_0x3fc37e){var _0x5bc810={'otvhw':function(_0x176612,_0xa8c784){return _0x176612(_0xa8c784);},'AglYf':function(_0x132f85,_0x3c2a11){return _0x132f85<_0x3c2a11;}};_0x3fc37e=unescape(_0x5bc810[_0x56ae('29',')s1H')](encodeURIComponent,_0x3fc37e));for(var _0x22a515=[],_0x5e366a=0x0;_0x5bc810['AglYf'](_0x5e366a,_0x3fc37e[_0x56ae('11','02D[')]);_0x5e366a++)_0x22a515[_0x56ae('2a','pJXM')](0xff&_0x3fc37e[_0x56ae('2b','nMic')](_0x5e366a));return _0x22a515;}function bytesToWords(_0x34d7a){var _0x425fa1={'mWgqc':function(_0x12fa30,_0x27569c){return _0x12fa30<_0x27569c;},'phTen':function(_0x5b2ef5,_0xfadbe0){return _0x5b2ef5<<_0xfadbe0;},'QmwvN':function(_0x1f8508,_0x553ce2){return _0x1f8508-_0x553ce2;}};for(var _0x3ce294=[],_0x36d8a1=0x0,_0x1acaad=0x0;_0x425fa1[_0x56ae('2c',']jjz')](_0x36d8a1,_0x34d7a[_0x56ae('2d','&aBJ')]);_0x36d8a1++,_0x1acaad+=0x8)_0x3ce294[_0x1acaad>>>0x5]|=_0x425fa1[_0x56ae('2e','x[[m')](_0x34d7a[_0x36d8a1],_0x425fa1[_0x56ae('2f','qj(q')](0x18,_0x1acaad%0x20));return _0x3ce294;}function crc32(_0x693ecd){var _0xa52efe={'xBJwK':function(_0x59f213,_0x256b95){return _0x59f213|_0x256b95;},'ecIKk':function(_0x4b0d44,_0x151abc){return _0x4b0d44&_0x151abc;},'zeyAT':function(_0x2f5bfc,_0x41354f){return _0x2f5bfc*_0x41354f;},'HybOw':function(_0x1f2eaa,_0x9c7523){return _0x1f2eaa&_0x9c7523;},'BhJHo':function(_0x115092,_0x25de7c){return _0x115092>>>_0x25de7c;},'jgVEC':function(_0xfddd6e,_0x1a63e8){return _0xfddd6e-_0x1a63e8;},'exPLT':function(_0x16f133,_0x304b17){return _0x16f133%_0x304b17;},'aPqXm':function(_0x1509e5,_0x216002){return _0x1509e5===_0x216002;},'XSDxf':'GRJeY','GGuXd':'qhOkX','LSMbp':function(_0x496673,_0x25a680){return _0x496673<_0x25a680;},'aBjRu':function(_0x22ab9e,_0x3c7717){return _0x22ab9e>_0x3c7717;},'Texcq':function(_0xf35801,_0x15ff0f){return _0xf35801|_0x15ff0f;},'FRbBa':function(_0x3d7d73,_0x19a210){return _0x3d7d73>>_0x19a210;},'blEnO':function(_0x1fbf62,_0x4c51fa){return _0x1fbf62|_0x4c51fa;},'vqiRH':function(_0x58e827,_0x5b216a){return _0x58e827>>_0x5b216a;},'mGIWA':function(_0x4b36ef,_0x1e31f1){return _0x4b36ef|_0x1e31f1;},'pViEU':function(_0x5e3339,_0x4eda19){return _0x5e3339^_0x4eda19;}};function _0x54a069(_0x9ed06c){if(_0xa52efe[_0x56ae('30','pE5E')](_0xa52efe[_0x56ae('31','0OdQ')],'TyAYc')){_0x4909a7+=String[_0x56ae('32','H@xj')](_0xa52efe[_0x56ae('33','3T!V')](_0x178a8e>>0x6,0xc0));_0x4909a7+=String[_0x56ae('34','%hPT')](_0xa52efe[_0x56ae('35','3eK[')](_0x178a8e,0x3f)|0x80);}else{_0x9ed06c=_0x9ed06c[_0x56ae('36','PR&Z')](/\r\n/g,'\x0a');var _0x4909a7='';for(var _0x298a78=0x0;_0x298a78<_0x9ed06c['length'];_0x298a78++){if('GirfJ'!==_0xa52efe[_0x56ae('37','XK#n')]){var _0x178a8e=_0x9ed06c[_0x56ae('38','yn)*')](_0x298a78);if(_0xa52efe[_0x56ae('39','52qr')](_0x178a8e,0x80)){_0x4909a7+=String[_0x56ae('3a','A#U9')](_0x178a8e);}else if(_0xa52efe[_0x56ae('3b','&aBJ')](_0x178a8e,0x7f)&&_0x178a8e<0x800){_0x4909a7+=String['fromCharCode'](_0xa52efe['Texcq'](_0xa52efe[_0x56ae('3c','XK#n')](_0x178a8e,0x6),0xc0));_0x4909a7+=String[_0x56ae('3a','A#U9')](_0xa52efe[_0x56ae('3d','PR&Z')](_0xa52efe['HybOw'](_0x178a8e,0x3f),0x80));}else{_0x4909a7+=String['fromCharCode'](_0xa52efe[_0x56ae('3e','&aBJ')](_0xa52efe['vqiRH'](_0x178a8e,0xc),0xe0));_0x4909a7+=String[_0x56ae('3f','XK#n')](_0xa52efe['HybOw'](_0x178a8e>>0x6,0x3f)|0x80);_0x4909a7+=String[_0x56ae('40','(j5&')](_0xa52efe[_0x56ae('41','nMic')](_0x178a8e&0x3f,0x80));}}else{for(var _0x4c3732=[],_0x4c61f8=0x0;_0x4c61f8<_0xa52efe['zeyAT'](0x20,t['length']);_0x4c61f8+=0x8)_0x4c3732[_0x56ae('42','cxeq')](_0xa52efe['HybOw'](_0xa52efe['BhJHo'](t[_0xa52efe['BhJHo'](_0x4c61f8,0x5)],_0xa52efe['jgVEC'](0x18,_0xa52efe[_0x56ae('43','Nh#v')](_0x4c61f8,0x20))),0xff));return _0x4c3732;}}return _0x4909a7;}};_0x693ecd=_0x54a069(_0x693ecd);var _0x40588a=[0x0,0x77073096,0xee0e612c,0x990951ba,0x76dc419,0x706af48f,0xe963a535,0x9e6495a3,0xedb8832,0x79dcb8a4,0xe0d5e91e,0x97d2d988,0x9b64c2b,0x7eb17cbd,0xe7b82d07,0x90bf1d91,0x1db71064,0x6ab020f2,0xf3b97148,0x84be41de,0x1adad47d,0x6ddde4eb,0xf4d4b551,0x83d385c7,0x136c9856,0x646ba8c0,0xfd62f97a,0x8a65c9ec,0x14015c4f,0x63066cd9,0xfa0f3d63,0x8d080df5,0x3b6e20c8,0x4c69105e,0xd56041e4,0xa2677172,0x3c03e4d1,0x4b04d447,0xd20d85fd,0xa50ab56b,0x35b5a8fa,0x42b2986c,0xdbbbc9d6,0xacbcf940,0x32d86ce3,0x45df5c75,0xdcd60dcf,0xabd13d59,0x26d930ac,0x51de003a,0xc8d75180,0xbfd06116,0x21b4f4b5,0x56b3c423,0xcfba9599,0xb8bda50f,0x2802b89e,0x5f058808,0xc60cd9b2,0xb10be924,0x2f6f7c87,0x58684c11,0xc1611dab,0xb6662d3d,0x76dc4190,0x1db7106,0x98d220bc,0xefd5102a,0x71b18589,0x6b6b51f,0x9fbfe4a5,0xe8b8d433,0x7807c9a2,0xf00f934,0x9609a88e,0xe10e9818,0x7f6a0dbb,0x86d3d2d,0x91646c97,0xe6635c01,0x6b6b51f4,0x1c6c6162,0x856530d8,0xf262004e,0x6c0695ed,0x1b01a57b,0x8208f4c1,0xf50fc457,0x65b0d9c6,0x12b7e950,0x8bbeb8ea,0xfcb9887c,0x62dd1ddf,0x15da2d49,0x8cd37cf3,0xfbd44c65,0x4db26158,0x3ab551ce,0xa3bc0074,0xd4bb30e2,0x4adfa541,0x3dd895d7,0xa4d1c46d,0xd3d6f4fb,0x4369e96a,0x346ed9fc,0xad678846,0xda60b8d0,0x44042d73,0x33031de5,0xaa0a4c5f,0xdd0d7cc9,0x5005713c,0x270241aa,0xbe0b1010,0xc90c2086,0x5768b525,0x206f85b3,0xb966d409,0xce61e49f,0x5edef90e,0x29d9c998,0xb0d09822,0xc7d7a8b4,0x59b33d17,0x2eb40d81,0xb7bd5c3b,0xc0ba6cad,0xedb88320,0x9abfb3b6,0x3b6e20c,0x74b1d29a,0xead54739,0x9dd277af,0x4db2615,0x73dc1683,0xe3630b12,0x94643b84,0xd6d6a3e,0x7a6a5aa8,0xe40ecf0b,0x9309ff9d,0xa00ae27,0x7d079eb1,0xf00f9344,0x8708a3d2,0x1e01f268,0x6906c2fe,0xf762575d,0x806567cb,0x196c3671,0x6e6b06e7,0xfed41b76,0x89d32be0,0x10da7a5a,0x67dd4acc,0xf9b9df6f,0x8ebeeff9,0x17b7be43,0x60b08ed5,0xd6d6a3e8,0xa1d1937e,0x38d8c2c4,0x4fdff252,0xd1bb67f1,0xa6bc5767,0x3fb506dd,0x48b2364b,0xd80d2bda,0xaf0a1b4c,0x36034af6,0x41047a60,0xdf60efc3,0xa867df55,0x316e8eef,0x4669be79,0xcb61b38c,0xbc66831a,0x256fd2a0,0x5268e236,0xcc0c7795,0xbb0b4703,0x220216b9,0x5505262f,0xc5ba3bbe,0xb2bd0b28,0x2bb45a92,0x5cb36a04,0xc2d7ffa7,0xb5d0cf31,0x2cd99e8b,0x5bdeae1d,0x9b64c2b0,0xec63f226,0x756aa39c,0x26d930a,0x9c0906a9,0xeb0e363f,0x72076785,0x5005713,0x95bf4a82,0xe2b87a14,0x7bb12bae,0xcb61b38,0x92d28e9b,0xe5d5be0d,0x7cdcefb7,0xbdbdf21,0x86d3d2d4,0xf1d4e242,0x68ddb3f8,0x1fda836e,0x81be16cd,0xf6b9265b,0x6fb077e1,0x18b74777,0x88085ae6,0xff0f6a70,0x66063bca,0x11010b5c,0x8f659eff,0xf862ae69,0x616bffd3,0x166ccf45,0xa00ae278,0xd70dd2ee,0x4e048354,0x3903b3c2,0xa7672661,0xd06016f7,0x4969474d,0x3e6e77db,0xaed16a4a,0xd9d65adc,0x40df0b66,0x37d83bf0,0xa9bcae53,0xdebb9ec5,0x47b2cf7f,0x30b5ffe9,0xbdbdf21c,0xcabac28a,0x53b39330,0x24b4a3a6,0xbad03605,0xcdd70693,0x54de5729,0x23d967bf,0xb3667a2e,0xc4614ab8,0x5d681b02,0x2a6f2b94,0xb40bbe37,0xc30c8ea1,0x5a05df1b,0x2d02ef8d];var _0x56ec6f=0x0;var _0x40341d=0x0;_0x40341d=_0x40341d^-0x1;for(var _0x1a5c47=0x0,_0x4c853e=_0x693ecd[_0x56ae('44','3eK[')];_0xa52efe[_0x56ae('45','cxeq')](_0x1a5c47,_0x4c853e);_0x1a5c47++){_0x56ec6f=_0x693ecd[_0x56ae('46','LZ2r')](_0x1a5c47);_0x40341d=_0xa52efe[_0x56ae('47','a7k1')](_0x40588a[_0xa52efe[_0x56ae('48','nMic')](0xff,_0xa52efe[_0x56ae('49','52qr')](_0x40341d,_0x56ec6f))],_0xa52efe[_0x56ae('4a','1680')](_0x40341d,0x8));}return _0xa52efe[_0x56ae('4b','0OdQ')](-0x1^_0x40341d,0x0);};function getBody(){var _0x59dab2={'BpqZa':function(_0x20b5b1,_0x54b66e){return _0x20b5b1*_0x54b66e;},'aYYjI':function(_0x399280,_0x520c05,_0x3b43a4){return _0x399280(_0x520c05,_0x3b43a4);},'WFqyu':_0x56ae('4c','L1Dy'),'xErwY':function(_0x20d719,_0x2bf5fc){return _0x20d719(_0x2bf5fc);},'HEQIu':function(_0x3458bd,_0x414f7f){return _0x3458bd(_0x414f7f);},'sxLWH':function(_0x4dbf67,_0x49c8b6){return _0x4dbf67(_0x49c8b6);},'NfKor':function(_0x969ae2,_0x3dba14){return _0x969ae2+_0x3dba14;},'jXwgq':function(_0x4c65fa,_0x24caf5){return _0x4c65fa+_0x24caf5;},'WMWSc':function(_0x3efb4f,_0x3053a7){return _0x3efb4f+_0x3053a7;},'uOtkh':function(_0x4ddc9a,_0x55ed81){return _0x4ddc9a+_0x55ed81;},'zGEtm':'~4,1~','Udoyy':_0x56ae('4d','QBwz'),'cgzox':_0x56ae('4e','pE5E')};let _0x4ab36f=Math[_0x56ae('4f','4Qx*')](0xf4240+_0x59dab2[_0x56ae('50','3T!V')](0x895440,Math[_0x56ae('51','3T!V')]()))['toString']();let _0x5590a0=_0x59dab2[_0x56ae('52',']jjz')](randomWord,![],0xa);let _0x5dbf0b=_0x59dab2[_0x56ae('53',')s1H')];let _0x1352c=Date['now']();let _0x31ea9f=_0x59dab2[_0x56ae('54','@S$K')](getKey,_0x1352c,_0x5590a0);let _0x597acb='random='+_0x4ab36f+_0x56ae('55','02D[')+_0x5dbf0b+_0x56ae('56',')JK2')+_0x1352c+'&nonce_str='+_0x5590a0+_0x56ae('57','sw&l')+_0x31ea9f+'&is_trust=1';let _0x360306=_0x59dab2[_0x56ae('58','hRJ3')](bytesToHex,_0x59dab2['xErwY'](wordsToBytes,_0x59dab2[_0x56ae('59','02D[')](getSign,_0x597acb)))[_0x56ae('5a','21sc')]();let _0x221cfd=_0x59dab2['sxLWH'](crc32,_0x360306)[_0x56ae('5b','pE5E')](0x24);_0x221cfd=add0(_0x221cfd,0x7);_0x360306=_0x59dab2[_0x56ae('5c','hC@1')](_0x59dab2[_0x56ae('5d','@S$K')](_0x59dab2[_0x56ae('5e','w6RM')](_0x59dab2[_0x56ae('5f','vZnG')](_0x59dab2[_0x56ae('60','pE5E')](_0x59dab2[_0x56ae('61','fu$%')](_0x59dab2[_0x56ae('62','cxeq')](_0x59dab2['uOtkh'](_0x1352c[_0x56ae('18','52qr')](),'~1')+_0x5590a0,_0x5dbf0b)+_0x59dab2[_0x56ae('63','Nh#v')],_0x360306),'~'),_0x221cfd),_0x59dab2[_0x56ae('64','PR&Z')]),_0x360306),'~')+_0x221cfd;s=JSON[_0x56ae('65','a7k1')]({'extraData':{'log':encodeURIComponent(_0x360306),'sceneid':_0x59dab2['cgzox']},'secretp':secretp,'random':_0x4ab36f[_0x56ae('66','@qzf')]()});return s;}function getSign(_0x5cacc0){var _0x15f892={'afbnh':function(_0x22b47b,_0x57d648){return _0x22b47b+_0x57d648;},'SticD':function(_0x4b24bd,_0x5a7379){return _0x4b24bd*_0x5a7379;},'rkLww':function(_0x34f612,_0x2d6673){return _0x34f612<_0x2d6673;},'WibsU':function(_0x25bc80,_0x5e5251){return _0x25bc80-_0x5e5251;},'sCngz':function(_0x5b1ee9,_0x477fde){return _0x5b1ee9|_0x477fde;},'ofBSg':function(_0x39104d,_0x346708){return _0x39104d>>_0x346708;},'MaFjE':function(_0xb59659,_0x4bdefe){return _0xb59659|_0x4bdefe;},'JTYLF':function(_0x27d340,_0x56aa19){return _0x27d340&_0x56aa19;},'HxsxI':function(_0x4a8a1e,_0x462b0c){return _0x4a8a1e(_0x462b0c);},'OXUZv':function(_0x4229ee,_0x195e3c){return _0x4229ee(_0x195e3c);},'dPJJm':function(_0x5763cb,_0xde0c2a){return _0x5763cb*_0xde0c2a;},'kzkOB':function(_0x18be43,_0x1283b6){return _0x18be43<<_0x1283b6;},'QLfYi':function(_0x484f2d,_0x5eb06a){return _0x484f2d%_0x5eb06a;},'Jnlzb':function(_0x2bdcbd,_0x2fb0c6){return _0x2bdcbd===_0x2fb0c6;},'WvKtK':_0x56ae('67',')s1H'),'XxsFU':function(_0x5b14ad,_0x3ed008){return _0x5b14ad<_0x3ed008;},'GxpeT':function(_0x5d6468,_0x58bbb4){return _0x5d6468!==_0x58bbb4;},'lqjFu':'gspzg','BJzha':_0x56ae('68','vZnG'),'dnksW':function(_0x1785c9,_0x54a8a8){return _0x1785c9^_0x54a8a8;},'HCQby':function(_0x1e0ca4,_0x3ce7ed){return _0x1e0ca4-_0x3ce7ed;},'IQCyE':function(_0x561d9e,_0x29035c){return _0x561d9e+_0x29035c;},'KAsUY':function(_0x57f03f,_0x36afa6){return _0x57f03f>>>_0x36afa6;},'VbKUj':function(_0x3cd528,_0x497284){return _0x3cd528<_0x497284;},'gsGWm':function(_0x9583dd,_0x2fe3a7){return _0x9583dd+_0x2fe3a7;},'hnnkT':function(_0x18e3b3,_0x4afa93){return _0x18e3b3&_0x4afa93;},'pBEtO':function(_0x10f9fe,_0x4756e3){return _0x10f9fe&_0x4756e3;},'rIOYM':function(_0x3b22f4,_0x4baeb5){return _0x3b22f4&_0x4baeb5;},'swczq':function(_0xebb578,_0x1cadd2){return _0xebb578-_0x1cadd2;},'zxTWG':function(_0x2a0c3e,_0x4c5f3b){return _0x2a0c3e^_0x4c5f3b;}};_0x5cacc0=_0x15f892[_0x56ae('69','w6RM')](stringToBytes,_0x5cacc0);var _0x15bd22=_0x15f892[_0x56ae('6a','L1Dy')](bytesToWords,_0x5cacc0),_0x2d2519=_0x15f892[_0x56ae('6b',')s1H')](0x8,_0x5cacc0[_0x56ae('6c','21sc')]),_0x15abb3=[],_0x40635c=0x67452301,_0x197705=-0x10325477,_0x20bd76=-0x67452302,_0x558d11=0x10325476,_0x9c4292=-0x3c2d1e10;_0x15bd22[_0x2d2519>>0x5]|=_0x15f892['kzkOB'](0x80,_0x15f892[_0x56ae('6d','pJXM')](0x18,_0x15f892[_0x56ae('6e','vZnG')](_0x2d2519,0x20))),_0x15bd22[_0x15f892[_0x56ae('6f','fu$%')](0xf,_0x15f892[_0x56ae('70','@S$K')](_0x15f892['afbnh'](_0x2d2519,0x40)>>>0x9,0x4))]=_0x2d2519;for(var _0x204470=0x0;_0x204470<_0x15bd22['length'];_0x204470+=0x10){for(var _0x22f4cf=_0x40635c,_0x248256=_0x197705,_0x52a21a=_0x20bd76,_0x25f181=_0x558d11,_0x4241e1=_0x9c4292,_0x4f4142=0x0;_0x4f4142<0x50;_0x4f4142++){if(_0x15f892[_0x56ae('71','LZ2r')](_0x15f892['WvKtK'],_0x56ae('72','HcbZ'))){if(_0x15f892['XxsFU'](_0x4f4142,0x10))_0x15abb3[_0x4f4142]=_0x15bd22[_0x204470+_0x4f4142];else{if(_0x15f892['GxpeT'](_0x15f892[_0x56ae('73','@qzf')],_0x15f892['BJzha'])){var _0x41a8f0=_0x15f892[_0x56ae('74','sff*')](_0x15f892[_0x56ae('75','21sc')](_0x15abb3[_0x4f4142-0x3]^_0x15abb3[_0x15f892['WibsU'](_0x4f4142,0x8)],_0x15abb3[_0x4f4142-0xe]),_0x15abb3[_0x15f892['HCQby'](_0x4f4142,0x10)]);_0x15abb3[_0x4f4142]=_0x15f892[_0x56ae('76','@qzf')](_0x41a8f0,0x1)|_0x41a8f0>>>0x1f;}else{let _0x4b81bb='',_0x4d74cb=min,_0x32719f=['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];if(randomFlag){_0x4d74cb=_0x15f892[_0x56ae('77','cxeq')](Math['round'](_0x15f892[_0x56ae('78','nMic')](Math[_0x56ae('79','qRY%')](),max-min)),min);}for(let _0x2dc776=0x0;_0x15f892[_0x56ae('7a','cxeq')](_0x2dc776,_0x4d74cb);_0x2dc776++){pos=Math[_0x56ae('7b','a7k1')](_0x15f892[_0x56ae('7c','02D[')](Math['random'](),_0x15f892[_0x56ae('7d','qRY%')](_0x32719f[_0x56ae('7e','3T!V')],0x1)));_0x4b81bb+=_0x32719f[pos];}return _0x4b81bb;}}var _0x48782d=_0x15f892['afbnh'](_0x15f892['IQCyE']((_0x40635c<<0x5|_0x15f892['KAsUY'](_0x40635c,0x1b))+_0x9c4292,_0x15abb3[_0x4f4142]>>>0x0),_0x15f892[_0x56ae('7f',')s1H')](_0x4f4142,0x14)?_0x15f892[_0x56ae('80','A#U9')](0x5a827999,_0x15f892[_0x56ae('81','hC@1')](_0x15f892[_0x56ae('82','3eK[')](_0x197705,_0x20bd76),_0x15f892['hnnkT'](~_0x197705,_0x558d11))):_0x15f892[_0x56ae('83','Rr3K')](_0x4f4142,0x28)?_0x15f892['gsGWm'](0x6ed9eba1,_0x15f892[_0x56ae('84','Rr3K')](_0x15f892[_0x56ae('74','sff*')](_0x197705,_0x20bd76),_0x558d11)):_0x4f4142<0x3c?_0x15f892[_0x56ae('85','4Qx*')](_0x197705&_0x20bd76|_0x15f892[_0x56ae('86','QBwz')](_0x197705,_0x558d11)|_0x15f892[_0x56ae('87','(j5&')](_0x20bd76,_0x558d11),0x70e44324):_0x15f892[_0x56ae('88','1680')](_0x15f892['dnksW'](_0x15f892[_0x56ae('89','Vdzy')](_0x197705,_0x20bd76),_0x558d11),0x359d3e2a));_0x9c4292=_0x558d11,_0x558d11=_0x20bd76,_0x20bd76=_0x15f892['MaFjE'](_0x197705<<0x1e,_0x15f892[_0x56ae('8a','iU6i')](_0x197705,0x2)),_0x197705=_0x40635c,_0x40635c=_0x48782d;}else{utftext+=String[_0x56ae('8b','ym8L')](_0x15f892[_0x56ae('8c','ym8L')](_0x15f892['ofBSg'](_0x20bd76,0xc),0xe0));utftext+=String[_0x56ae('8d','INfv')](_0x15f892[_0x56ae('8e','ym8L')](_0x15f892['JTYLF'](_0x20bd76>>0x6,0x3f),0x80));utftext+=String[_0x56ae('8f','LB]6')](_0x15f892[_0x56ae('90','hRJ3')](_0x20bd76,0x3f)|0x80);}}_0x40635c+=_0x22f4cf,_0x197705+=_0x248256,_0x20bd76+=_0x52a21a,_0x558d11+=_0x25f181,_0x9c4292+=_0x4241e1;}return[_0x40635c,_0x197705,_0x20bd76,_0x558d11,_0x9c4292];};_0xodI='jsjiami.com.v6';
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
