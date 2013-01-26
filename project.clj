(defproject webrot/webrot "0.1.0-SNAPSHOT" 
  :dependencies [[org.clojure/clojure "1.5.0-RC3"]
                 [noir "1.3.0"]
                 [ns-tracker "0.2.1"]
                 [jayq "2.0.0"]
                 [crate "0.2.4"]
                 [rm-hull/fetch "0.1.1-SNAPSHOT"]
                 [rm-hull/monet "0.1.3-SNAPSHOT"]
                 [rm-hull/ring-gzip-middleware "0.1.4-SNAPSHOT"]
                 [ring/ring-core "1.1.6"]
                 [ring-basic-authentication "1.0.1"]
                 [com.cemerick/drawbridge "0.0.6"]]
:cljsbuild
{:builds
 [{:source-paths ["src/webrot/client/mandlebrot"],
   :compiler
   {:pretty-print true,
    :output-to "resources/public/cljs/mandlebrot.js",
    :externs ["externs/jquery.js"],
    :optimizations :simple,
    :print-input-delimiter true}}
  {:source-paths ["src/webrot/client/conway"],
   :compiler
   {:output-to "resources/public/cljs/conway.js",
    :externs ["externs/jquery.js"],
    :optimizations :simple}}]}

  :hooks [leiningen.cljsbuild]
  :plugins [[lein-cljsbuild "0.3.0"]]
  :profiles {:dev {:dependencies [[vimclojure/server "2.3.6"]]}}
  :main webrot.server
  :min-lein-version "2.0.0"
  :warn-on-reflection true
  :description "A web-based fractal generator")
