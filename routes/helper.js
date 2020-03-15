"use strict";
/* @author park */
var config = require('../config/config');

class Helper {
    //console.log("HELPER");

    /**
     * Returns the ip value
     * @param {*} req 
     * @param {*} which 
     * @return
     */
    checkIP(req, which) {
        var ip = 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket.remoteAddress;
        console.log("Helper.checkIP",ip,which);
        return ip;
    };

    isPrivate(req, res, next) {
        if (config.isPrivatePortal) {
            if (self.isAuthenticated(req)) {
                return next();
            }
            return res.redirect("/login");
        } else {
            return next();
        }
    };

    /**
     * Prefill a JSONObject with data for rendering
     * @return
     * /
    self.startData = function(req) {
//        console.log("Helper.startData",req.session);
        var title = config.brand;
        var result = { title: title };
        if (req.flash) {
            result.flashMsg = req.flash("error") || req.flash("success");
        }
        if (self.isAuthenticated(req)) {
            result.isAuthenticated = true;
            result.userId = req.session.theUserId;
        }
        result.invitationOnly = config.invitationOnly;
        self.isAdmin(req, function(truth) {
            result.isAdmin = truth;
        });
        //current conversation
        result.curCon = req.session.curCon;
        //remembered
        result.isRemembered = req.session.transclude;
//        console.log("XYZ-2",req.session.curCon,req.session.theUser);
        return result;
    };

    /**
     * This will be extended to ask if user is an admin
     * @param {*} userId 
     * @param {*} node 
     */
    canEdit(userId, node) {
        return (userId === node.creatorId);
    };
    
    canDelete(userId, node) {
        var hasIBISkids = CommonModel.hasIBISChildren(node);
        return (self.canEdit(userId, node) && !hasIBISkids);
    };

    isAuthenticated(req) {
//        console.log("Helper.isAuthenticated",req.session);
        if (req.session.theUser) {
            return true;
        }
        return false;
    };

    /**
     * @param req
     * @param {*} callback truth
     */
    async isAdmin(req) {
        var email = req.session.theUserEmail;
        return await AdminModel.checkIsAdmin(email);
    };

    logout(req) {
        //DO NOTHING FOR NOW
        req.session.theUser = null;
    };

}


const instance = new Helper();
module.exports = instance;
