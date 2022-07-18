#![allow(unused)]


/** Don't change */
#[cfg(feature = "exercise2")]
mod validation;
#[cfg(feature = "exercise2")]
mod post;
#[cfg(feature = "exercise2")]
mod publication_role;
#[cfg(feature = "exercise2")]
mod membrane;
#[cfg(feature = "exercise2")]
mod properties;

#[cfg(not(feature = "exercise2"))]
extern crate private_publication_integrity;
