import user from "../store/user.js";

const handleMessage = (msg, type, callBack) => {
    if (msg.indexOf(type + ":") > -1) {
        callBack();
    }
};

export const handleClientMessage = (ws, msg) => {
    console.log(msg);
};
