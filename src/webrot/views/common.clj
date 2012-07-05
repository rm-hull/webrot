(ns webrot.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.core :only [html]]
        [hiccup.page :only [include-css include-js html5]]
        [hiccup.element :only [javascript-tag]]
        [compojure.response]
        [ring.util.response :only [response content-type]]
        [clojure.java.io :only [make-input-stream]])
  (:import [javax.imageio ImageIO]
           [java.awt.image RenderedImage]
           [java.io ByteArrayInputStream ByteArrayOutputStream]))

; When using {:optimizations :whitespace}, the Google Closure compiler combines
; its JavaScript inputs into a single file, which obviates the need for a "deps.js"
; file for dependencies.  However, true to ":whitespace", the compiler does not remove
; the code that tries to fetch the (nonexistent) "deps.js" file.  Thus, we have to turn
; off that feature here by setting CLOSURE_NO_DEPS.
;
; Note that this would not be necessary for :simple or :advanced optimizations.
(defn- include-clojurescript [path]
  (list
      (javascript-tag "var CLOSURE_NO_DEPS = true;")
          (include-js path)))

(defpartial layout [& content]
  (html5
    [:head
     [:title "Webrot"]
     (include-css "/css/reset.css")
     ;(include-css "/css/default.css")
     (include-css "/css/spinner.css")
     ;(include-js "https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js")
     ;(include-js "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js")
     (include-js "js/jquery.min.js")
     (include-js "js/jquery-ui.min.js")
     (include-js "js/jquery.ui.touch-punch.min.js")]
    [:body
     [:div#wrapper
      content]
      (include-clojurescript "/cljs/bootstrap.js")
     ]))

(defpartial spinner [css-class]
  (html
    [:div#spinner {:class css-class }
      [:div {:class "spinner"}
        (for [x (range 1 13)]
          (html 
            [:div {:class (str "bar" x)}]))]]))

(defn- create-pipe [f pipe-size]
  (with-open [out-stream (ByteArrayOutputStream. pipe-size)]
    (f out-stream)
    (ByteArrayInputStream. (.toByteArray out-stream))))

(extend-protocol Renderable
  RenderedImage
  (render [this _]
    (let [stream (create-pipe #(ImageIO/write this "png" %) 0x20000)]
      (content-type (response stream) "image/png"))))
