import Axios from "axios"
const axios = Axios.create();

export const initVideo = (par) => {
     return axios
    .get(
        `/jsapi/initallvideo/open`,{params:par}
    ).then(res => res.data)
}
export const lockVideo = (par) => {
    return axios
   .post(
       `/jsapi/lockvideo`,par
   ).then(res => res.data)
}

export const getLockVideo = () => {
    return axios.get(
       `/jsapi/lockvideo`
   ).then(res => res.data)
}

export const changeVideo = (par) => {
    return axios
    .post("/jsapi/changertsp", par).then(res => res.data)
}