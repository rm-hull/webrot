(defproject webrot "0.1.0-SNAPSHOT"
  :description "A web-based Mandlebrot-set generator"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [noir "1.3.0-beta7"]
                 ;[jayq "0.1.0-alpha4"]
                 ;[fetch "0.1.0-alpha2"]
                 [ring/ring-core "1.1.0"]
                 [ring-basic-authentication "1.0.1"]
                 [com.cemerick/drawbridge "0.0.3"]]
  :main webrot.server
  :plugins [[lein-cljsbuild "0.2.1"]]
  :hooks [leiningen.cljsbuild]
  :cljsbuild {
    :builds [{
        :source-path "src"
        :compiler {
          :output-to "resources/public/cljs/bootstrap.js"
          :optimizations :whitespace
          :pretty-print true}}]})

