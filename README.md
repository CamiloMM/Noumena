# Noumena Introduction

<img align="right" src="graphics/logo.min.png" width="256" height="256"/>

I believe information is key to everything. Knowing why your application crashed from a remote report is much more reliable than waiting for bug reports to crop up on an issue tracker.

So I need an event tracking system. One that's easy to use, easy to understand, very predictable and doesn't make too many assumptions on what you're using it for. Having taken a look at Google Analytics, it's totally unsuitable to anything other than a website, and *one that accepts javascript* at that (so it's not useful for sites where you may just have an account, even though images could work as a tracker beacon). Plus, unless you're one of those people that worry more about search engines than the raw quality of a product, you very likely do not understand all of Google Analytics huge arrangement of tools and features.

In other words, I believe in a simple tool that can bend itself to varied use-cases and doesn't require much fore-thought into it, and especially not implementation difficulties where no technical limitation existed. Have something you want logged? Just log it, and later you'll figure out what to do with it. Can only embed images? No problem, because that shouldn't stop you.

I believe the main reason people don't [log all the things] is because it's fucking tedious to set everything up, to make sense of it, and to decide when and where to even make a decent effort at logging. It should be something you can safely add as an after-thought and still have something useful in your hands, while still being able to plan it out from the development phase.

At the same time, I think a logging system is something that should be simple enough for you to understand as a system; therefore I encourage you to build your own too. I don't know where this system will lead me, or even if it will lead me to a conclusion that contradicts my assumptions. In either case, this is just a side project of mine and I don't know if it will "pay off" or result in something of respectable quality. Interpret everything you see onward as a rough sketch of a system.

Enough with this mumbo-jumbo.

# Assumptions

This is meant for a single developer or trusted group having access to the server instance. It is not multi-user, and not fit for a large organization. The use-case is a single developer tracking personal projects and other information on his behalf and that of other people who he chooses to. It also does not take into account scalability beyond a single server instance.

It is also assumed that the user of this has full access to the server instance (this can be restricted to e.g., an Unix user), knows how to SSH, edit files and basic sysadmin stuff.

Most importantly: the system is not designed to be idiot-proof, and an user with the proper credentials will be trusted not to shoot himself in the foot.

# Implementation

### Events

Everything that happens is an "event". Pageview, email opened, video played, API accessed, all is an event of some sort, with certain information that it provides, and gathering context from this should be done at a later stage; you just need to record what happens with ease.

Events are composed of a number of fields:

| Field | Type | Description |
|-------|------|-------------|
| `project` | UTF-8 string | Name of the project being tracked. Example: "Personal Blog" |
| `category` | UTF-8 string | What does the event deal with. Example: "Posts" |
| `action` | UTF-8 string | What kind of thing happened. Example: "View" |
| `data` | JSON object | Data describing the action. Example: `{"id": 34, "date": "2015-03-05T10:40:38.723Z"}` |

The last field is optional, and when not specified, defaults to an auto-incrementing integer starting from `1`. Both formats can co-exist; in which case a variety of rows will describe event items with data and one will count the data-less events.

The server instance will store all events received in a NoSQL database, indexed for the first three fields, and possibly other fields within `data`.

The last field is a JSON object, and as such, can hold anything. Realistically, you should keep it consistent so it's easier to gather info from it later.

Note how this system does not provide distinction between event types: if you want to record a "pageview", record an event that describes a pageview.

### Flags

Adding certain "flags" when logging an event will add automatic properties to it. Each flag is a single letter, and each logging method will provide a way to pass flags.

| Flag | Description |
|------|-------------|
| `i` | `ip` field will contain the IP address from where the request came as a string such as `123.4.56.789` |
| `g` | `lat` will contain latitude, `lon` will contain longitude, and `country` will contain the [ISO 3166-1 alpha-2] country code, all strings, all guessed from the IP of the request. Note that setting `g` will use the IP but you still must specify `i` if you want it recorded. the special field `geo` will be a constant `true` value, to indicate the presence of the other three. |
| `t` | `time` will contain the current time and date as an [Unix Epoch timestamp]. |
| `a` | `agent` will contain a string describing the user-agent of the request (if available). |
| `b` | `browser` will be a string guessed from the `agent` (which won't be implicitly stored). |
| `f` | Store an user's `fingerprint`, which is stable enough to identify a single user through one or more sessions, but variable enough that it will avoid most collisions. |
| `n` | The `num` key will contain an auto-incrementing integer that uniquely identifies the event. It is guaranteed to be unique and always incrementing, but it is sparse; it may start in whatever positive number (from 1) and may contain gaps (all events use the same system, and moreover they can all be deleted individually). |
| `h` | `headers` will be an object containing the http headers for the request. |
| `*` | Equivalent to specifying all flags (use for debug only). |

To avoid confusion, refrain from adding fields in `data` with the names `ip`, `lat`, `lon`, `country`, `geo`, `time`, `agent`, `browser`, `fingerprint`, `num` and `headers`.

### Logging methods

There will be various logging methods, most available through HTTP, and utility libraries for languages I use (like client-side and server-side javascript). It will all be easy to use no matter the context; `curl` an URL and you've logged an event.

The methods will be documented in length when they're ready. Preliminarly, they'll be:

* **`GET` request** (limited `data` size)
* **`POST` request**
* **Pixel beacon** (in essence, a `GET` request that returns a transparent pixel)
* **SVG beacon** (to circumvent proxying like what GitHub does)
* **JS embed** (similar to Google Analytics stuff)
* **Local API** (for use within the server instance)
* **Remote API(s)** (such as a wrapper node module)

### Views

Views will be templates that you can code (with help of an API), upload to the server, and use to make sense of data. You'll go to a web interface, choose a view, and it will render a neat report of the events.

It is very important that this is simple enough to do, but very expressive. For this reason, I'm guessing the best way to approach this is uploading .js files to the server and visiting an URL, without any more fuss than that.

# Current Status

Front-end is progressing very well, and I'm working on the DB layer. Come back in another month.

[log all the things]: http://i.imgur.com/VdiUT.jpg
[ISO 3166-1 alpha-2]: http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
[Unix Epoch timestamp]: http://en.wikipedia.org/wiki/Unix_time
