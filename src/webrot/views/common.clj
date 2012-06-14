(ns webrot.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page :only [include-css html5]]
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
      (include-css "/css/reset.css")]
    [:body
      [:div#wrapper
        content]]))

(defn- create-pipe [f pipe-size]
  (with-open [out-stream (ByteArrayOutputStream. pipe-size)]
    (f out-stream)
    (ByteArrayInputStream. (.toByteArray out-stream))))

(extend-protocol Renderable
  RenderedImage
  (render [this _]
    (let [stream (create-pipe #(ImageIO/write this "png" %) 0x20000)]
      (content-type (response stream) "image/png"))))

