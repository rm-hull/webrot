(defproject webrot "0.1.0-SNAPSHOT"
  :description "A web-based Mandlebrot-set generator"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [noir "1.3.0-beta10"]
                 [jayq "0.1.0-alpha4"]
                 [crate "0.2.0-alpha4"]
                 [fetch "0.1.0-alpha2"]
                 [ring/ring-core "1.1.1"]
                 [ring-basic-authentication "1.0.1"]
                 [ibdknox/ring-gzip-middleware "0.1.1"]
                 [com.cemerick/drawbridge "0.0.6"]]
  :main webrot.server
  :warn-on-reflection true
  :plugins [[lein-cljsbuild "0.2.1"]]
  :dev-dependencies [[vimclojure/server "2.3.3"]]
  ;:hooks [leiningen.cljsbuild]
  :cljsbuild {
    :builds [{
        :source-path "src"
        :compiler {
          :output-to "resources/public/cljs/bootstrap.js"
          :optimizations :whitespace ;:advanced
          :externs ["https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"]         
          :pretty-print true}}]})

