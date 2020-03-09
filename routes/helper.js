/* @author park */
var config = require('../config/config');
var Helper,
    instance;

Helper = function() {
    var self = this;
    //console.log("HELPER");

    /**
     * Returns the ip value
     * @param {*} req 
     * @param {*} which 
     * @return
     */
    self.checkIP = function(req, which) {
        var ip = 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket.remoteAddress;
        console.log("Helper.checkIP",ip,which);
        return ip;
    };

    self.isPrivate = function (req, res, next) {
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
    self.canEdit = function(userId, node) {
        return (userId === node.creatorId);
    };
    
    self.canDelete = function(userId, node) {
        var hasIBISkids = CommonModel.hasIBISChildren(node);
        return (self.canEdit(userId, node) && !hasIBISkids);
    };

    self.isAuthenticated = function(req) {
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
    self.isAdmin = function(req, callback) {
        var email = req.session.theUserEmail;
        AdminModel.checkIsAdmin(email, function(truth) {
            console.log("Helper.isAdmin",truth);
            return callback(truth);
        });
    };

    self.logout = function(req) {
        //DO NOTHING FOR NOW
        req.session.theUser = null;
    };

};
if (!instance) {
    instance = new Helper();
}
module.exports = instance;