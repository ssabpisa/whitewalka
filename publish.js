var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://washington:poly@ds025772.mlab.com:25772/alphastoka');

var collectionData = require('./collection.json')

var Profile = mongoose.model('Profile', new Schema({
    any: {}
}, {
    strict: false
}));

function getEmail(head) {
    var re = /[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?/gi
    var cc = (JSON.stringify(head) + "").match(re);
    if (cc == null) return "N/A";
    return cc.join(",").replace(/\s/g, '').replace(/-/g, '');
}

function getPhoneNumber(head) {
    //+66 97 140 6640
    //097-140-6640
    //0971406640
    //097 140 6640

    var re = /(0|(\+66))\s?[0-9]{2}(\s|-)?[0-9]{3}(\s|-)?[0-9]{4}/g;
    var cc = (head + "").match(re);
    if (cc == null) return "N/A";
    return cc.join(",").replace(/\s/g, '').replace(/-/g, '');
}

function getLocale(object) {
    //Look at all heads and comments
    var rkorean = /[가-힣]+/g
    var rthai = /[ก-๙]+/g
    var rjapanese = new RegExp('[一-龯]+', 'g')

    var korean = (JSON.stringify(object) + "").match(rkorean);
    var thai = (JSON.stringify(object) + "").match(rthai);
    var japanese = (JSON.stringify(object) + "").match(rjapanese);

    var Ranks = [{
        name: 'Thailand',
        rank: (thai !== null ? thai.join("").length : 0)
    }, {
        name: 'Korean',
        rank: (korean !== null ? korean.join("").length : 0)
    }, {
        name: 'Japanese',
        rank: (japanese !== null ? japanese.join("").length : 0)
    }]

    Ranks.sort(function(a, b) {
        return b.rank - a.rank;
    });
    // console.log(Ranks);

    return Ranks[0].rank != 0 ? Ranks[0].name : 'Unknown';

}

function getCategory(images) {
    //Look at images and infer via watson
}

function getFollowerCount(head) {
    var re = /([0-9,]+[km]?)\sfollowers/i;
    var cc = (head + "").match(re)
    if (!cc || cc.length < 2) {
        return 0;
    }

    if (cc[1].indexOf('m') > 0) {
        return Number(cc[1].replace(/,/g, '').substr(0, cc[1].length - 1)) * (1000000);
    }

    if (cc[1].indexOf('k') > 0) {
        return Number(cc[1].replace(/,/g, '').substr(0, cc[1].length - 1)) * (1000);
    }

    return Number(cc[1].replace(/,/g, ''));
}

var i = 0;
var skipct = 0;
for (var username in collectionData) {
    var obj = collectionData[username];
    if(obj.images.length == 0){
        console.log("[SKIP]", ++skipct)
        continue;
    }
    obj.follower_count = getFollowerCount(obj.header);
    obj.phone_number = getPhoneNumber(obj.header);
    obj.locale = getLocale(obj);
    obj.email = getEmail(obj.header);

    var rprofile = new Profile(obj);
    rprofile.save(function(err) {
        if (err) {
            console.log('[ERR] ', err);
        } else {
            console.log("[UPLOADED] ", username, i++);
        }
    });
}
