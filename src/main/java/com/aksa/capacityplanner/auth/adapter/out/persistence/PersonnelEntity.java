package com.aksa.capacityplanner.auth.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "personnel")
@Getter
@Setter
public class PersonnelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String company;

    private String department;

    private String title;

    @Column(name = "extension_attribute_4")
    private String extensionAttribute4;

    @Column(name = "extension_attribute_6")
    private String extensionAttribute6;

    @Column(name = "extension_attribute_8")
    private String extensionAttribute8;

    private String roles;

    private boolean active;
}