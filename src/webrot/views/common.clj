(ns webrot.views.common
  (:use [noir.core :only [defpartial]]
 ;       [hiccup.page-helpers :only [include-css html5]]
        [compojure.response]
        [ring.util.response :only [response content-type]]
        [clojure.java.io :only [make-input-stream]])
  (:import [javax.imageio ImageIO]
           [java.awt.image RenderedImage]
           [java.io PipedInputStream PipedOutputStream]))

;(defpartial layout [& content]
;  (html5
;    [:head
;      [:title "Webrot"]
;      (include-css "/css/reset.css")]
;    [:body
;      [:div#wrapper
;        content]]))

(defn- create-pipe [f]
  (let [in-stream (PipedInputStream.)]
    (future
      (with-open [out-stream (PipedOutputStream. in-stream)]
        (f out-stream)))
    in-stream))

(extend-protocol Renderable
  RenderedImage
  (render [this _]
    (let [stream (create-pipe #(ImageIO/write this "png" %))]
      (content-type (response stream) "image/png"))))

