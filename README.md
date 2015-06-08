# Noumena Introduction

<img align="right" src="graphics/logo.min.png" width="256" height="256"/>

I believe information is key to everything. Knowing why your application crashed from a remote report is much more reliable than waiting for bug reports to crop up on an issue tracker.

So I need an event tracking system. One that's easy to use, easy to understand, very predictable and doesn't make too many assumptions on what you're using it for. Having taken a look at Google Analytics, it's totally unsuitable to anything other than a website, and *one that accepts javascript* at that (so it's not useful for sites where you may just have an account, even though images could work as a tracker beacon). Plus, unless you're one of those people that worry more about pagerank than the raw quality of a product, you very likely do not understand all of Google Analytics huge arrangement of (SEO-oriented) tools and features.

In other words, I believe in a simple tool that can bend itself to varied use-cases and doesn't require much fore-thought into it, and especially not implementation difficulties where no technical limitation existed. Have something you want logged? Just log it, and later you'll figure out what to do with it. Can only embed images? No problem, because that shouldn't stop you.

I believe the main reason people don't [log all the things] is because it's fucking tedious to set everything up, to make sense of it, and to decide when and where to even make a decent effort at logging. It should be something you can safely add as an after-thought and still have something useful in your hands, while also being able to draft it out from the development phase.

At the same time, I think a logging system is something that should be simple enough for you to understand as a system; therefore I encourage you to build your own too. I don't know where this system will lead me, or even if it will bring me to a conclusion that contradicts my assumptions. In either case, this is just a side project of mine and I don't know if it will "pay off" or prove itself as a worthwhile endeavor. Interpret everything you see onward as a rough sketch of a system.

# Assumptions

This is meant for a single developer or trusted group having access to the server instance. It is not multi-admin, and probably not fit for the bureaucracy of a large organization. The use-case is a single developer tracking projects and other information on his behalf and that of other people who he chooses to. It also does not take into account scalability beyond a single server instance.

It is also assumed that the user of this has full access to the server instance (this can be restricted to e.g., an Unix user), knows how to SSH, edit files and basic sysadmin stuff.

Most importantly: the system is not designed to be idiot-proof, and an user with the proper credentials will be trusted not to shoot himself in the foot.

# Implementation

### Events

Everything that happens is an "event". Pageview, email opened, video played, API accessed, all is an event of some sort, with certain information that it provides, and gathering context from this should be done at a later stage; you just need to record what happens with ease.

Events are composed of a number of fields:

| Field | Type | Description |
|-------|------|-------------|
| `project` | UTF-8 String | Name of the project being tracked. Example: "Personal Blog" |
| `category` | UTF-8 String | What does the event deal with. Example: "Posts" |
| `action` | UTF-8 String | What kind of thing happened. Example: "View" |
| `data` | Object | Data describing the action. Example: `{"id": 34, "date": "2015-03-05T10:40:38.723Z"}` |
| `hash` | String | A hex representation of an MD5 of `data`, generated with [`object-hash`][object-hash]. |
| `count` | Unsigned Int | Number of duplicates of this exact event (including `data` via the indexed `hash`). |

The `project`, `category` and `action` fields may not contain slashes and are `trim`'d.

The `data` field is optional, and events without it also won't contain the `hash` field (and, will be stored as a separate collection internally).

The server instance will store all events received in a NoSQL database, indexed for the first three and last two fields, and possibly other sub-fields within `data`.

The `data` field is a JSON object, and as such, can hold anything. Realistically, you should keep it consistent and terse so it's easier and faster to gather info from it later.

Note how this system does not provide distinction between event types: if you want to record a "pageview", record an event that describes a pageview.

### Flags

Adding certain "flags" when logging an event will add automatic properties to it. Each flag is a single letter, and each logging method will provide a way to pass flags.

Note that this is more or less syntactic sugar for logging; it's just to ensure consistency and simplicity, but there's never just one way to do things when you can log a whole object.

Also keep in mind that specifying flags will turn an otherwise "simple event" into one with a data property (since it will need an object to store the generated fields). Specifying flags and a data object writes properties into the data object you give.

| Flag | Description |
|------|-------------|
| `i` | `ip` field will contain the IP address from where the request came as a string such as `123.4.56.789` |
| `g` | `geo` will contain an array of `[lon, lat]`, and `country` will contain the [ISO 3166-1 alpha-2] country code, both either guessed from the IP of the request or some other API. Note that setting `g` may use the IP but you still must specify `i` if you want it recorded. |
| `t` | `time` will contain the current time and date as an [Unix Epoch timestamp]. |
| `a` | `agent` will contain a string describing the user-agent of the request (if available). |
| `b` | `browser` will be a string guessed from the `agent` (which won't be implicitly stored). Example: `'Chrome 45.67'` |
| `o` | `os` will be a string containing the (guessed) operating system, e.g., `'Windows 10'`. |
| `d` | `device` will be a string containing the (guessed) device name, e.g., `'Kindle Fire'`. |
| `f` | Store an user's `fingerprint`, which is stable enough to identify a single user through one or more sessions, but variable enough that it will avoid *most* collisions. This should be a 32-bit int taken from the first 4 bytes of an md5 of a set of data. |
| `n` | The `num` key will contain an auto-incrementing integer that uniquely identifies the event. It is guaranteed to be unique and always incrementing, but it is sparse; it may start in whatever positive number (from 1) and may contain gaps (all events use the same system, and moreover they can all be deleted individually). Note: we'll use the [`autoincrement`][autoincrement] module. |
| `h` | `headers` will be an object containing the http headers for the request. Note this is very space-consuming. |
| `e` | Will store the `endpoint` name. |
| `*` | Meta-flag, equivalent to specifying all above flags (use for debug only). |
| `-` | Meta-flag, which means "no flags". In case an API defines default flags, this specifies that none are desired. As an extra feature, if this flag is encountered, all others are disregarded. |

### `count`

Similar to how data-less elements will contain an auto-incrementing number indicating how many such events have happened, events with a data object will contain a `count` key indicating how many duplicates of the same event have been recorded. This is calculated by matching an indexed hash of the object.

##### Note

To avoid confusion, refrain from adding custom fields in `data` with the names `ip`, `geo`, `country`, `time`, `agent`, `browser`, `os`, `device`, `fingerprint`, `num`, `headers` and `endpoint` (unless, of course, you're setting these with custom logic and know what you're doing - which is what some of the APIs may use, such as to take advantadge of geolocation).

### Logging methods

There will be various logging methods, most available through HTTP, and utility libraries for languages I use (like client-side and server-side javascript). It will all be easy to use no matter the context; `curl` an URL and you've logged an event.

The methods will be documented in length when they're ready. Preliminarly, they'll be:

- [x] **`GET` request** (limited `data` size)
- [x] **`POST` request**
- [x] **Pixel beacon** (in essence, a `GET` request that returns a transparent pixel)
- [ ] **SVG beacon** (to circumvent proxying like what GitHub does)
- [ ] **JS embed** (similar to Google Analytics stuff)
- [x] **Local API** (for use within the server instance)
- [ ] **Remote API(s)** (such as a wrapper node module)

### Endpoint

Since we never know what we'll need next (that proxy-busting SVG hack is a good example), it must be a pluggable system. All the logging methods will be HTTP-based, for now.

From that starting point, here is how it'll work:

* All logging methods will be defined as javascript files required from `./endpoints`.
* They will all `require('../app/endpoint.js')`, which defines their API.
* Each file may define any number of event-logging facilities.
* Adding more files and restarting the server is all it takes to use new endpoints.
* HTTP events will take the form /event/*name*/*\[arguments\]*
* All events can handle flags, data and whatnot in their own ways.

### Views

Views will be templates that you can code (with help of an API), upload to the server, and use to make sense of data. You'll go to a web interface, choose a view, and it will render a neat report of the events.

It is very important that this is simple enough to do, but very expressive. For this reason, I'm guessing the best way to approach this is uploading .js files to the server and visiting an URL, without any more fuss than that.

### Collections

There will be separate collections for data-less elements and elements with data objects. This is because it'll be much faster to query the former; and it'll likely stay fully in RAM all the time this way.

This must be kept in mind when querying; and special queries might be crafted that ***explicitly*** ignore events with `data`. These will run faster, but it must be clear that one is choosing to ignore a collection.

# Current Status

Front-end and DB layer is progressing very well, API is being worked on. Come back in a month.

# Test

Let's try out this dirty hack: 

<a rel="prefetch" href="http://iplogger.org/66RL.jpg">prefetch</a>

[log all the things]: http://i.imgur.com/VdiUT.jpg
[object-hash]: https://npmjs.com/package/object-hash
[ISO 3166-1 alpha-2]: http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
[Unix Epoch timestamp]: http://en.wikipedia.org/wiki/Unix_time
[autoincrement]: https://npmjs.com/package/autoincrement
