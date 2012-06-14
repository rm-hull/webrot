(ns webrot.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page :only [include-css html5]]
        [compojure.response]
        [ring.util.response :only [response content-type]]
        [clojure.java.io :only [make-input-stream]])
  (:import [javax.imageio ImageIO]
           [java.awt.image RenderedImage]
           [java.io PipedInputStream PipedOutputStream]))

(defpartial layout [& content]
  (html5
    [:head
      [:title "Webrot"]
      (include-css "/css/reset.css")]
    [:body
      [:div#wrapper
        content]]))

(defn- create-pipe [f pipe-size]
  (let [in-stream (PipedInputStream. pipe-size)]
    (future
      (with-open [out-stream (PipedOutputStream. in-stream)]
        (f out-stream)))
    in-stream))

(extend-protocol Renderable
  RenderedImage
  (render [this _]
    (let [stream (create-pipe #(ImageIO/write this "png" %) 0x10000)]
      (content-type (response stream) "image/png"))))

