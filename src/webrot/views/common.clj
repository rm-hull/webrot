(ns webrot.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page :only [include-css include-js html5]]
        [compojure.response]
        [ring.util.response :only [response content-type]]
        [clojure.java.io :only [make-input-stream]])
  (:import [javax.imageio ImageIO]
           [java.awt.image RenderedImage]
           [java.io ByteArrayInputStream ByteArrayOutputStream]))

(defpartial layout [& content]
  (html5
    [:head
     [:title "Webrot"]
     (include-css "/css/reset.css")
     (include-css "/css/default.css")
     (include-js "https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js")]
    [:body
     [:div#wrapper
      content]
     (include-js "/cljs/bootstrap.js")]))

(defn- create-pipe [f pipe-size]
  (with-open [out-stream (ByteArrayOutputStream. pipe-size)]
    (f out-stream)
    (ByteArrayInputStream. (.toByteArray out-stream))))

(extend-protocol Renderable
  RenderedImage
  (render [this _]
    (let [stream (create-pipe #(ImageIO/write this "png" %) 0x20000)]
      (content-type (response stream) "image/png"))))

