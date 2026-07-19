package com.katsurank;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import jakarta.persistence.Entity;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureTest {

    private final JavaClasses classes = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.katsurank");

    @Test
    void controllersDoNotDependOnRepositories() {
        noClasses().that().resideInAPackage("..controller..")
                .should().dependOnClassesThat().resideInAPackage("..repository..")
                .check(classes);
    }

    @Test
    void entitiesDoNotDependOnWebLayer() {
        noClasses().that().areAnnotatedWith(Entity.class)
                .should().dependOnClassesThat()
                .resideInAnyPackage("..controller..", "..dto..", "..common.web..")
                .check(classes);
    }

    @Test
    void servicesDoNotDependOnWebLayer() {
        noClasses().that().resideInAPackage("..service..")
                .should().dependOnClassesThat().resideInAPackage("..controller..")
                .check(classes);
    }

    @Test
    void repositoriesDoNotDependOnUpperLayers() {
        noClasses().that().resideInAPackage("..repository..")
                .should().dependOnClassesThat()
                .resideInAnyPackage("..controller..", "..service..")
                .check(classes);
    }

    @Test
    void rankingServiceDoesNotDependOnRestaurantFeature() {
        noClasses().that().resideInAPackage("..ranking.service..")
                .should().dependOnClassesThat().resideInAPackage("..restaurant..")
                .check(classes);
    }
}
