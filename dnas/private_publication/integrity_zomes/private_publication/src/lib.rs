#![allow(unused)]

/** Don't change */

#[cfg(not(feature = "exercise"))]
pub mod membrane;
#[cfg(not(feature = "exercise"))]
pub mod post;
#[cfg(not(feature = "exercise"))]
pub mod properties;
#[cfg(not(feature = "exercise"))]
pub mod publication_role;
#[cfg(not(feature = "exercise"))]
pub mod validation;
#[cfg(not(feature = "exercise"))]
pub use validation::*;

#[cfg(not(feature = "exercise2"))]
extern crate private_publication_integrity;
