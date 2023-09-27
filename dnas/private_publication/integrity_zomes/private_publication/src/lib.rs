#![allow(unused)]

/** Don't change */

#[cfg(feature = "exercise2")]
pub mod membrane;
#[cfg(feature = "exercise2")]
pub mod post;
#[cfg(feature = "exercise2")]
pub mod properties;
#[cfg(feature = "exercise2")]
pub mod publication_role;
#[cfg(feature = "exercise2")]
pub mod validation;
#[cfg(feature = "exercise2")]
pub use validation::*;

#[cfg(not(feature = "exercise2"))]
extern crate private_publication_integrity;
